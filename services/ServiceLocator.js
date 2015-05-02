var events = require('events');

/**
 * Конструктор класса
 * @todo добавить возможность цепочек инициализации сервисов друг за другом
 * @todo добавить таймауты на ыремя инициализации
 * @param {object} config
 * @returns {ServiceLocator}
 */
var ServiceLocator = function(config) {
    this.config = config;
    this.services = {};
    
    // регистрация сервисов на инициализацию
    for(var name in config) {
        this._register(name, config[name]);
    }
    
    // расстановка зависимостей
    for(var name in this.services) {
        var dependencies = config[name].dependencies;
        
        if(dependencies) {
            var service = this.services[name];

            for(var name in dependencies)
                service._registerDependency(dependencies[name], this.services[dependencies[name]]);
        }
    }
};

/**
 * Наследуем класс сервис локатора от класса эмитера событий
 * @type events.EventEmitter
 */
ServiceLocator.prototype = new events.EventEmitter;

/**
 * Запускает процедуру инициализации сервисов
 * @param {function} callback
 */
ServiceLocator.prototype.init = function() {
    // запуск инициализации сервисов не имеющих зависимостей
    for(var name in this.services) {
        var dependencies = this.config[name].dependencies;
        
        if(!dependencies || dependencies.length <= 0) {
            this.services[name].init();
        }
    }
};

/**
 * Процедура регистрации сервиса в сервис локаторе
 * @param {string} name имя сервиса
 * @param {object} config структура с параметрами инициализации сервиса
 */
ServiceLocator.prototype._register = function(name, config) {
    var self = this;
    var d = require('domain').create();
    d.add(self);
    d.on('error', function(err) {if(global.logger) {logger.log('error', err.stack);} else {console.log(err.stack);}});
    
    d.run(function(){
        var serviceObject = require(__dirname + "/"+config.library);
        var service = new serviceObject(name, config);

        service.on('initialized', function(name, service){
            if(service.initTimeout)
                clearTimeout(service.initTimeout);
            
            self._initialized(name, service);
        });

        service.on('timeout', function(name){
            logger.log('error', "Initialization service timeout for service %s", name);
            process.exit();
        });

        self.services[name] = service;
    });
};

/**
 * Получение сервиса с указанным именем
 * @param {string} serviceName
 * @returns {object}
 */
ServiceLocator.prototype.get = function(name) {
    if(this.services[name] === undefined)
        throw new Error("Uncknown service required: " + name);
    if(this.services[name] === false)
        throw new Error(name + " service not initialized yet");
    
    return this.services[name];
};

/**
 * Производит проверку завершения инициализации сервисов
 * @param {string} name
 * @returns {undefined}
 */
ServiceLocator.prototype._initialized = function (name, service){
    this.services[name] = service;
    logger.log('info', "Service " + name + " initialized");

    for(var i in this.services)
        if(this.services[i].initialized === false)
            return;

    logger.log('debug', 'Service Locator initialized');
    this.emit('initialized');
};

module.exports = ServiceLocator;