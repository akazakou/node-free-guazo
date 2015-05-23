var config = require('config');

module.exports.autoroute = {
    get: {
        '/' : indexAction,
    },
    
    delete: {
        '/delete/:hash' : deleteAction
    }
};

function indexAction(req, res){
    serviceLoader.get('ManagerImages').getList({}, function(imageData){
        
        res.render('index.twig', {
            title: "Node.js Company Guazo | Fast Showed Images",
            data: imageData,
            imageUrl: config.get('upload.imageUrl'),
            url: config.get('upload.url')
        });
    });
}

function deleteAction(req, res){
    var hash = req.params.hash;

    var fsdelete = function() {
        var fs = require('fs-extra');
        var path = config.get('upload.directory') + hash + '.png';
        fs.delete(path, function(){
            res.send("");
        });
    };
    
    serviceLoader.get('ManagerImages').delete(hash, function(result){
        fsdelete();
    });
}