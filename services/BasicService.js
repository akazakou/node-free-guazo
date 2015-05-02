var events = require('events');

/**
 * Конструктор класса
 * @param {type} config
 */
var BasicService = function(name, config) {
    this.initialized = false;
    this.name = name;
    this.config = config;
    this.dependency = {};
};

/**
 * Наследуем класс сервис локатора от класса эмитера событий
 * @type events.EventEmitter
 */
util.inherits(BasicService, events.EventEmitter);

/**
 * Инициализация сервиса
 */
BasicService.prototype.init = function (){
    var self = this;
    
    this._initTimeout();
    setTimeout(function(){
        self.initialized = true;
        self.emit('initialized', self.name, self);
    }, 2500);
};

/**
 * Запуск таймера, отсчитывающего время для инициализации, отведенное сервису для успешной инициализации
 */
BasicService.prototype._initTimeout = function() {
    var self = this;
    this.initTimeout = setTimeout(function(){
        self.emit('timeout', self.name);
    }, this.config.initTimeout || 5000);
};

/**
 * Регистрация зависимостей от сервисов, только после готовности которых можно начинать инициализацию текущего сервиса
 * @param {string} name
 * @param {object} service
 */
BasicService.prototype._registerDependency = function(name, service) {
    var self = this;
    this.dependency[name] = false;
    
    service.on('initialized', function(name, service){
        self.dependency[name] = true;
        
        for(var i in self.dependency)
            if(self.dependency[i] === false)
                return;
        
        self.init();
    });
};

module.exports = BasicService;