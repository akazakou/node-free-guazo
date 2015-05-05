var basic = require('./BasicService');

var Cron = function(name, config){
    this.name = name;
    this.config = config;
    this.dependency = {};
    this.initialized = false;
};

/**
 * Наследуем класс сервис локатора от класса эмитера событий
 * @type events.EventEmitter
 */
util.inherits(Cron, basic);

/**
 * Процедура иницализации сервиса
 */
Cron.prototype.init = function()
{
    this._initTimeout();
    
    var deleteOldFiles = function(hash){
        var path = require('config').get('upload.directory') + hash + ".png";
        var fs = require('fs-extra')

        fs.remove(path, function (err) {
            var sql = "DELETE FROM `images` WHERE `md5`='" + hash + "'";
            serviceLoader.get('Database').connection.query(sql, function(err, result){
                logger.log('debug', util.format("Delete too old file with hash %s", hash));
            });
        });
    };
    
    setInterval(function(){
        var sql = "SELECT `md5` FROM `images` WHERE `lifetime` < NOW()";
        serviceLoader.get('Database').connection.query(sql, function(err, result){
            if(err) throw err;
            for(var key in result) 
                deleteOldFiles(result[key]['md5']);
        });
    }, this.config.periodTime);
    
    this.initialized = true;
    this.emit('initialized', this.name, this);
};

module.exports = Cron;