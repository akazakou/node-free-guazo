var basic = require('./BasicService'),
    jsonPath = require('JSONPath'),
    events = require('events');

/**
 * Конструктор класса
 * @param {type} config
 */
var EventsHandler = function(name, config) {
    this.initialized = false;
    this.name = name;
    this.config = config;
    this.dependency = {};
    
    this.handlers = [];
};

/**
 * Наследуем класс сервис локатора от класса эмитера событий
 * @type events.EventEmitter
 */
util.inherits(EventsHandler, basic);

/**
 * Инициализация сервиса
 */
EventsHandler.prototype.init = function (){
    this._initTimeout();
    
    this.initialized = true;
    this.emit('initialized', this.name, this);
};

/**
 * Выбор хендлера для обработки сообщения и передача его обработчику
 * @param {type} message
 * @param {type} headers
 * @param {type} deliveryInfo
 * @param {type} messageObject
 * @returns {undefined}
 */
EventsHandler.prototype.amqpMessage = function (message, headers, deliveryInfo, messageObject){
    var handlerUsed = false;
    
    for(var i in this.config.handlers) {
        var handler = this.config.handlers[i];
        if(handler.routingKey === deliveryInfo.routingKey) {
            handlerUsed = true;
            var data = this._extractData(message, handler.data);
            data['date'] = deliveryInfo.timestamp ? moment(deliveryInfo.timestamp).toISOString("YYYY-MM-DDTHH:mm:ss.sssZZ") : moment().toISOString("YYYY-MM-DDTHH:mm:ss.sssZZ");
            
            logger.log('debug', util.format('Service "%s" extract data %j', this.name, data));
            serviceLoader.get(this.config.databaseService).insertIgnore(handler.table, data);
        }
    }
    
    if(!handlerUsed)
        logger.log('warn', util.format('Service "%s" not route message to extract data by routing key "%s"', this.name, deliveryInfo.routingKey));
};

/**
 * Получение данных из сообщения по схеме, указанной в конфигурации
 * @param {object} message
 * @param {object} schema
 * @returns {EventsHandler.prototype._extractData.extracted}
 */
EventsHandler.prototype._extractData = function (message, schema){
    var data = {};
    
    for(var field in schema) {
        var extracted = jsonPath.eval(message, schema[field]);
        data[field] = extracted[0] || null;
    }
    
    return data;
};

module.exports = EventsHandler;