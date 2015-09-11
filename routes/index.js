var config = require('config');

module.exports.autoroute = {
    get: {
        '/' : indexAction,
    }
};

function indexAction(req, res){
    serviceLoader.get('ManagerImages').getList({"owner": req.sessionID}, function(imageData){
        
        res.render('index.twig', {
            title: "Node.js Company Guazo | Fast Showed Images",
            data: imageData,
            imageUrl: config.get('upload.imageUrl'),
            url: config.get('upload.url')
        });
    });
}