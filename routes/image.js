var config = require('config');

module.exports.autoroute = {
    get: {
        '/image/:hash': imageAction,
        '/lifeup/:hash': lifeupAction,
        '/delete/:hash': deleteAction
    }
};

function imageAction(req, res) {
    var hashValue = req.params.hash;

    serviceLoader.get('ManagerImages').getList({
        md5: hashValue
    }, function (imageData) {

        if (imageData.length === 0)
            res.status(404);

        res.render('image.twig', {
            title: "Node.js Company Guazo | Image " + hashValue,
            hash: hashValue,
            imageUrl: config.get('upload.imageUrl'),
            url: config.get('upload.url'),
            data: imageData
        });
    });
}

function deleteAction(req, res) {
    var hash = req.params.hash;

    var fsdelete = function () {
        var fs = require('fs-extra');
        var path = config.get('upload.directory') + hash + '.png';

        if(typeof fs.delete === 'function') {
            fs.delete(path, function () {
                res.redirect('/');
            });
        } else {
            logger.log('error', util.format('Can\'t delete image %s', path));
            res.redirect('/');
        }
    };

    serviceLoader.get('ManagerImages').delete(hash, function (result) {
        fsdelete();
    });
}

function lifeupAction(req, res) {
    var hash = req.params.hash;
    serviceLoader.get('ManagerImages').lifeup(hash, function (result) {
        res.redirect(config.get('upload.url') + hash);
    });
}