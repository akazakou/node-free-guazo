var config = require('config');

// initializate and map routes
module.exports.autoroute = {
    get: {
        '/image/:hash': imageAction,
        '/lifeup/:hash': lifeupAction,
        '/delete/:hash': deleteAction
    }
};

/**
 * Displaying image information 
 * @param {Request} req
 * @param {Response} res
 */
function imageAction(req, res) {
    var hashValue = req.params.hash;

    serviceLoader.get('ManagerImages').getList({
        md5: hashValue
    }, function (imageData) {

        for(key in imageData) {
            if(imageData[key].owner === "") {
                serviceLoader.get('ManagerImages').connectOwner(hashValue, req.sessionID, function(){
                    logger.log('debug', util.format("Set owner %s for %s image hash", req.sessionID));
                });
            }
        }

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

/**
 * Delete image from database and warehouse
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
function deleteAction(req, res) {
    var hash = req.params.hash;

    // delete image from warehouse
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

    // delete image from database
    serviceLoader.get('ManagerImages').delete(hash, req.sessionID, function (result) {
        fsdelete();
    });
}

/**
 * up image life cycle
 * @param {type} req
 * @param {type} res
 */
function lifeupAction(req, res) {
    var hash = req.params.hash;
    serviceLoader.get('ManagerImages').lifeup(hash, function (result) {
        res.redirect(config.get('upload.url') + hash);
    });
}