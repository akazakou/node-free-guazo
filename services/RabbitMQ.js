var amqp = require('amqp'),
    basic = require('./BasicService'),
    events = require('events');

/**
 * Конструктор класса
 * @param {type} config
 */
var RabbitMQ = function(name, config) {
    this.initialized = false;
    this.name = name;
    this.config = config;
    this.dependency = {};
    this.connection = null;
    this.handlers = [];
};

/**
 * Наследуем класс сервис локатора от класса эмитера событий
 * @type events.EventEmitter
 */
util.inherits(RabbitMQ, basic);

/**
 * Инициализация сервиса
 */
RabbitMQ.prototype.init = function (){
    this._initTimeout();
    
    // производим инициализацию хендлеров для сообщений из очереди сообщений
    for(var i in this.config.handlers) {
        var handlerConfig = this.config.handlers[i];
        var service = serviceLoader.get(handlerConfig.service);
        var regexp = handlerConfig.routingKey.replace(/\*/g,'[a-zA-Z0-9]+');
        
        // проверяем что хендлер действительно существует
        if((typeof service[handlerConfig.method]) !== 'function')
            return logger.log('error', util.format('Can not find method "%s" in service "%s" for routingKey "%s"', handlerConfig.method, handlerConfig.service, handlerConfig.routingKey));
        
        // регестрируем хендлер
        this.handlers[i] = {
            config: handlerConfig,
            regexp : new RegExp(regexp, 'ig'),
            service: service
        };
    }
    
    logger.log("debug", util.format('Service "%s" initialized %d handlers for queue messagess', this.name, this.handlers.length));
    
    var self = this;
    var connection = amqp.createConnection(this.config.connection);
    
    // После установления соединения, выполняем функцию
    connection.on('ready', function(){
        logger.log('debug', util.format('Service "%s" success connected to AMQP server', self.name));
        self.connection = connection;
        self.listen();
        
        // тестовое сообщение в очередь отправляем
        var exchange = connection.exchange("auth2", {passive: true}, function(){
            var request = require('request');
            request('http://auth2.zzima.com/version/2/login?login=gromo551&password=111222333&userIP=192.168.17.161&caller=fw', function(error, response, body){
                exchange.publish("auth2.default.version2.login", JSON.parse(body));
            });
        });
        
    }).on('error', function(err){
        logger.log("error", util.format('Error in "%s" service on intitialization', self.name), err.stack);
    });
};

/**
 * Навешивание обработчика на все поступающие сообщения
 * @param {funciton} callback
 */
RabbitMQ.prototype.listen = function (){
    var self = this;
    var subscriptions = this.config.subscriptions;
    // создаем очередь
    this.connection.queue(this.config.queue.name, this.config.queue.options, function(queue){
        
        // оформление подписки на все события
        for(var exchange in subscriptions) {
            for(var i in subscriptions[exchange]) {
                queue.bind(exchange, subscriptions[exchange][i]);
                logger.log("debug", util.format('Subscribed service "%s" to exchange "%s" on routing key "%s"', self.name, exchange, subscriptions[exchange][i]));
            }
        }
        
        // Вешаем консумера на прослушивание очереди
        queue.subscribe(function (message, headers, deliveryInfo, messageObject) {
            try
            {
                // разрешена обработка только json сообщений
                if(deliveryInfo.contentType !== 'application/json') 
                    return logger.log("error", util.format('Recived message for service "%s" from queue "%s" have wrong contentType', self.name, self.config.queue.name), {"type": message.contentType, "data": message.toString()});
                
                logger.log('debug', util.format('Service "%s" recive message from queue "%s"', self.name, self.config.queue.name), message);
                
                // перенаправляем сообщение в зарегестрированный обработчик
                self._routeMessage(message, headers, deliveryInfo, messageObject);
            } catch(err) {
                logger.log("error", util.format('Error handled on reciving message: %s', err.stack));
            }
        });
        
        logger.log("debug", util.format('RabbitMQ service attached to queue "%s"', self.config.queue.name));
        
        // сообщаем о завершении инициализации сервиса
        self.initialized = true;
        self.emit('initialized', self.name, self);
    });
};

/**
 * Производит маршрутизацию указанного сообщения до обработчика на основе routingKey
 * @param {AMQPMessage} message
 * @param {object} headers
 * @param {AMQPDeliveryInfo} deliveryInfo
 * @param {AMQPMessageObject} messageObject
 */
RabbitMQ.prototype._routeMessage = function (message, headers, deliveryInfo, messageObject){
    for(var i in this.handlers) {
        var handler = this.handlers[i];
        
        if(handler.regexp.test(deliveryInfo.routingKey)) {
            logger.log('debug', util.format('Service "%s" route message to method "%s" from service "%s"', this.name, handler.config.method, handler.config.service));
            return handler.service[handler.config.method](message, headers, deliveryInfo, messageObject);
        }
    }
    
    logger.log('warn', util.format('Message can not be routed by routingKey "%s"', deliveryInfo.routingKey), message);
};

module.exports = RabbitMQ;