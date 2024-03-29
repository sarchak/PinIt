
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
var querystring = require("querystring");
var http = require('http');
var url = require("url");
var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://192.168.1.150/syncit');
var everyauth = require('everyauth')
  , Promise = everyauth.Promise;
var Schema = mongoose.Schema;
var UserSchema = new Schema({})
  , User;
var $ = require('jquery');
var mongooseAuth = require('mongoose-auth');
var nodemailer = require('nodemailer');
var transport = nodemailer.createTransport("Sendmail", "/usr/sbin/sendmail");
console.log('Sendmail Configured');


UserSchema.plugin(mongooseAuth, {
    everymodule: {
      everyauth: {
          User: function () {
            return User;
          }
      }
    }
  , password: {
        loginWith: 'email'
      , scope: 'email'
      , extraParams: {
   			name: String
        }
      , everyauth: {
            getLoginPath: '/login'
          , postLoginPath: '/login'
          , loginView: 'login.jade'
          , getRegisterPath: '/register'
          , postRegisterPath: '/register'
          , registerView: 'register.jade'
          , loginSuccessRedirect: '/v1/'
          , registerSuccessRedirect: '/v1/'
        }
    }
});

mongoose.model('User', UserSchema);

mongoose.connect('mongodb://192.168.1.150/syncit');

User = mongoose.model('User');

var app = module.exports = express.createServer();

var syncrec = new Schema({'username': String, 
                          'email':String,
                          'title':String, 
                          'url':String, 
                          'text': String, 
                          'tags': String ,  
                          date : { type : Date, default: Date.now}
                         });

var SyncDB = mongoose.model('SyncDB', syncrec);
app.configure(function(){
  var oneYear = 31557600000;
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'esoognom', cookie: {maxAge: oneYear}}));
  app.use(mongooseAuth.middleware());
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.get('/', function(req,res){
	console.log("User:"+req.user);
	if(req && req.user) {
	   	var user = req.user;
		res.render('bingo')	
	} else {
		res.render('home')
	}
	
});
app.get('/v1/',function(req,res){
	res.render('bingo')
});
app.get('/search', function(req,res){
  if(!req.loggedIn){
   res.writeHeader(401,"Login required");
   res.end();	
  } else {
	  var quer = url.parse(req.url).query;
	  var keyword = querystring.parse(quer)["q"];
	  console.log(req.user.email +":"+keyword);
	  SyncDB.find({'email':req.user.email, 'text' : new RegExp(keyword, 'i')}, function (err, doc){
	    res.writeHeader(200,'OK');
	    res.write(JSON.stringify(doc));
	    res.end();
	  });
  }
});
app.post('/mail', function(req,res){
	console.log("I am coming here\n");
	console.log(req.body);
	var message = {

	    // define transport to deliver this message
	    transport: transport, 

	    // sender info
	    from: 'feedback@hashedOut.info',

	    // Comma separated list of recipients
	    to: 'shrikar84@gmail.com',

	    // Subject of the message
	    subject: 'Feedback from ' + req.body.name || req.body.email, //

	    // plaintext body
	    text: req.body.message,
	};

	console.log('Sending Mail');

	nodemailer.send_mail(message, function(error){
	    if(error){
	        console.log('Error occured');
	        console.log(error.message);
	        return;
	    }
	    console.log('Message sent successfully!');
	});
	res.writeHeader(200,'OK');
    res.write("success");
    res.end();
});
app.post('/upload', function(req, res){
  console.log(req.url);
  if(!req.loggedIn){
	  console.log("Not logged in");
      res.writeHeader(401,"Login required");
      res.end();
  }else{
	  if(req.body.text == "undefined"){
	    //console.log('preparing request to ' + req.body.url)
	    u = require('url').parse(req.body.url);
	    var body="";
	    var options = {
		  host: u['host'],
		  port: 80,
		  path: u['pathname']
		};
	    http.get(options, function(result) { 
		  result.addListener('data', function (chunk) {
	            body += chunk;
	          });
	          result.addListener('end', function(){
		      console.log("Sync the whole page");
		      var rec  = new SyncDB({'username':req.user.name,
	                         'email': req.user.email,
	                         'title': req.body.title,
	                         'url':req.body.url,
	                         'text':body,
	                         'tags':req.body.tags
	             });
	             rec.save()
	             res.writeHeader(200,'OK');
	             res.end();
		  });
		})
	  }
	  else {
	   var rec  = new SyncDB({'username':req.user.name,
	                         'email': req.user.email,
	                         'title': req.body.title,
	                         'url':req.body.url,
	                         'text':req.body.text,
	                         'tags':req.body.tags
	                        });
	   rec.save()
	   res.writeHeader(200,'OK');
	   res.end();
	 }
  }

});

mongooseAuth.helpExpress(app);
app.listen(8888);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

