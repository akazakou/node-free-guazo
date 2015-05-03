module.exports.autoroute = {
    get: {
        '/' : indexAction,
        '/image/:hash' : imageAction
    }
};

function indexAction(req, res){
    res.send('index action');
}

function imageAction(req, res){
    res.send('image action');
}