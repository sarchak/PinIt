
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
var querystring = require("querystring");
var http = require('http');
var querystring = require("querystring");
var url = require("url");
var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://192.168.1.150/syncit');
var everyauth = require('everyauth')
  , Promise = everyauth.Promise;
var Schema = mongoose.Schema;
var UserSchema = new Schema({})
  , User;
var mongooseAuth = require('mongoose-auth');

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
          , loginSuccessRedirect: '/'
          , registerSuccessRedirect: '/'
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
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'esoognom'}));
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
	res.render('home');
});

app.get('/search', function(req,res){
  console.log(req.url);
  var quer = url.parse(req.url).query;
  var keyword = querystring.parse(quer)["q"];
  console.log(keyword);
  SyncDB.find({'text' : new RegExp(keyword, 'i')}, function (err, doc){
    console.log(doc)
    res.writeHeader(200,'OK');
    res.write(JSON.stringify(doc));
    res.end();
  });
});
app.post('/upload', function(req, res){
  console.log(req.url);
  console.log(req.body.username,req.body.email,req.body.title,req.body.text,req.body.url);
  console.log(req.body.text);
  if(req.body.text == "undefined"){
    console.log('preparing request to ' + req.body.url)
    u = require('url').parse(req.body.url);
    var body="";
    var options = {
	  host: u['host'],
	  port: 80,
	  path: u['pathname']
	};
    http.get(options, function(result) { 
 	  console.log("Got response: " + result.statusCode);
	  result.addListener('data', function (chunk) {
            body += chunk;
            console.log("chunk recieved\n");
          });
          result.addListener('end', function(){
	    var rec  = new SyncDB({'username':req.body.username,
                         'email': req.body.email,
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
   var rec  = new SyncDB({'username':req.body.username,
                         'email': req.body.email,
                         'title': req.body.title,
                         'url':req.body.url,
                         'text':req.body.text,
                         'tags':req.body.tags
                        });
   rec.save()
   res.writeHeader(200,'OK');
   res.end();
 }
});

mongooseAuth.helpExpress(app);
app.listen(8888);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
