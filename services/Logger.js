var events = require('events');
var winston = require('winston');
var basic = require('./BasicService');

var Logger = function(name, config){
    this.name = name;
    this.config = config;
    this.dependency = {};
    this.initialized = false;
};

/**
 * Наследуем класс сервис локатора от класса эмитера событий
 * @type events.EventEmitter
 */
util.inherits(Logger, basic);

/**
 * Процедура иницализации сервиса
 */
Logger.prototype.init = function()
{
    this._initTimeout();
    this._initErrorLog(this.config.logs.error || null);
    this._initAccessLog(this.config.logs.access || null);
    this.initialized = true;
    this.emit('initialized', this.name, this);
};

/**
 * Отправка в error лог сообщения
 */
Logger.prototype.log = function() {
    arguments[1] = util.format("[pid:%d] %s", process.pid, arguments[1]);
    this.error.log.apply(this.error, arguments);
};

/**
 * Инициализация лога ошибок
 * @param {object} settings
 */
Logger.prototype._initErrorLog = function(settings) {
    
    winston.loggers.add('error', {
        console: {
            level: 'debug',
            colorize: 'true',
            label: 'ERRORLOG',
            prettyPrint: true,
            depth: 1,
            timestamp: function() {return moment().format('YYYY-MM-DD HH:mm:ss ZZ'); }
        },
        dailyRotateFile: {
            level: settings.level || 'error',
            colorize: false,
            json: true,
            meta: true,
            filename: settings.path || 'default.error.log',
            timestamp: function() {return moment().toISOString(); }
        }
    });
    
    this.error = winston.loggers.get('error');
    global.logger = this;
};

/**
 * Инициализация лога запросов к серверу
 * @param {object} settings
 */
Logger.prototype._initAccessLog = function(settings) {
    
    // Логи HTTP запросов к серверу
    winston.loggers.add('access', {
        console: {
            level: 'debug',
            colorize: 'true',
            label: 'ACCESSLOG',
            meta: true,
            timestamp: true
        },
        dailyRotateFile: {
            level: settings.level || 'info',
            colorize: false,
            json: true,
            filename: settings.path || 'default.access.log',
            timestamp: function() {return moment().toISOString(); }
        }
    });
    
    this.access = winston.loggers.get('access');
};

module.exports = Logger;