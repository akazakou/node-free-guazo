module.exports.autoroute = {
    post: {
        '/upload.cgi': uploadAction
    }
};

/*
 { imagedata: 
 { fieldName: 'imagedata',
 originalFilename: 'gyazo.com',
 path: '/tmp/19281-1ru1ikp.com',
 headers: [Object],
 ws: [Object],
 size: 12870,
 name: 'gyazo.com',
 type: null } }
 
 */

/**
 * Принимает в себя данные загруженного файла, после чего 
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
function uploadAction(req, res) {
    var fs = require('fs-extra'), 
        config = require('config');
    
    var copyFile = function (hash, source) {
        var path = config.get('upload.directory') + hash + '.png';
        var url = config.get('upload.url') + hash + '.png';
        
        fs.move(source, path, function(){
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