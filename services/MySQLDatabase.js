var basic = require('./BasicService'),
    events = require('events'),
    mysql = require('mysql');

/**
 * Конструктор класса
 * @param {type} config
 */
var MySQLDatabase = function(name, config) {
    this.initialized = false;
    this.name = name;
    this.config = config;
    this.dependency = {};
    
    this.connection = {};
};

/**
 * Наследуем класс сервис локатора от класса эмитера событий
 * @type events.EventEmitter
 */
util.inherits(MySQLDatabase, basic);

/**
 * Инициализация сервиса
 */
MySQLDatabase.prototype.init = function (){
    this._initTimeout();
    
    var connection = mysql.createConnection(this.config.connection);
    var self = this;
    
    connection.connect(function(err) {
        if (err) {
            return logger.log('error', util.format('Service "%s" can not connect to MySQL database "%s" on host "%s"\n', self.name, self.config.connection.database, self.config.connection.host), err.stack);
        }

        self.initialized = true;
        self.connection = connection;
        self.emit('initialized', self.name, self);
    });
    
};

/**
 * Вставка данных в таблицу с игнорированием дублирующихся ключей
 * @param {type} table
 * @param {type} data
 * @returns {undefined}
 */
MySQLDatabase.prototype.insertIgnore = function (table, data, callback){
    var self = this;
    this.connection.query('INSERT INTO ?? SET ?', [table, data], function(err, result){
        if(err) return logger.log('error', util.format('Service "%s" can not complete query' + "\n" + err.stack, self.name));
        if(callback !== undefined) callback(result);
    });
};

module.exports = MySQLDatabase;