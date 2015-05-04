module.exports.autoroute = {
    post: {
        '/upload.cgi': uploadAction
    }
};

/**
 * Принимает в себя данные загруженного файла, после чего помещает информацию о загруженном файле в базу данных
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
function uploadAction(req, res) {
    var fs = require('fs-extra'),
        imageinfo = require('imageinfo'),
        config = require('config');
    
    var registerFile = function (path, url, hash) {
        fs.readFile(path, function(err, data) {
            if (err) throw err;

            // получение основных данных по изображению
            var info = imageinfo(data);
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            
            // сохранение информации по файлу в базу данных
            serviceLoader.get('Database').insertIgnore('images', {
                "md5": hash,
                "mime" : info.mimeType,
                "date" : moment().toISOString(),
                "ip" : ip,
                "width" : info.width,
                "height" : info.height,
                "size" : data.length
            }, function(mysqlResult){
                logger.log('debug', util.format("Image with hash: %s stored success", hash));
            });
        });
    };
    
    var copyFile = function (hash, source) {
        var path = config.get('upload.directory') + hash + '.png';
        var url = config.get('upload.url') + hash + '.png';
        
        fs.move(source, path, function(){
            registerFile(path, url, hash);
            res.send(url);
        });
    };
    
    var calculateMD5 = function (path) {
        var md5 = require('MD5');

        fs.readFile(path, function(err, buf) {
            copyFile(md5(buf), path);
        });
    };

    calculateMD5(req.files.imagedata.path);
}