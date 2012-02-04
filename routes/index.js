
/*
 * GET home page.
 */

exports.index = function(req, res){
	 console.log(req.url);
	 res.render('index', { title: 'Express'});
};
