
/*
 * GET home page.
 */
var mongoose = require('mongoose');	
exports.index = function(req, res){
	 console.log(req.url);
	 var SyncDB = mongoose.model('SyncDB');
	 var ret = SyncDB.find({'username':'shrikar'});
	 console.log(ret);
	 res.render('index', { title: 'Express' ,name:'shrikar', result: ret});
};
