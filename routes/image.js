module.exports.autoroute = {
    get: {
        '/image/:hash': imageAction
    }
};

function imageAction(req, res) {
    var hashValue = req.params.hash;
    
    serviceLoader.get('ManagerImages').getList({
        md5 : hashValue
    }, function(imageData){
        
        if(imageData.length === 0) res.status(404);
        
        res.render('image.twig', {
            title: "Node.js Company Guazo | Image " + hashValue,
            hash: hashValue,
            data: imageData
        });
    });
}