var express = require('express');
var router = express.Router();
var mongoClient = require('mongodb').MongoClient;
var db_url = "mongodb://localhost:27017/e-club-db";
var path = require("path");
var ObjectID = require('mongodb').ObjectID;
var passport = require('passport');

var Strategy = require('passport-local').Strategy;

var auth = require('../auth');

router.use(require('cookie-parser')());
router.use(require('body-parser').urlencoded({ extended: true }));
router.use(require('express-session')({ secret: 'supersecretsave', resave: false, saveUninitialized: false }));

passport.use(new Strategy(
  function(username, password, cb) {
    auth.users.findByUsername(username, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != password) { return cb(null, false); }
      return cb(null, user);
    });
  }));
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
}); 
passport.deserializeUser(function(id, cb) {
  auth.users.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

router.use(passport.initialize());
router.use(passport.session());

/* GET home page. */
router.get('/', function(req, res, next) {
	var inventory_res;
	mongoClient.connect(db_url,function(err,db){
		inventory_res = db.collection('inventory').find().toArray(function(err,docs){
			db.close();
			res.render('index', { title: 'Electronics Club @ OSU', user:req.user});
		});; 	
	});
	//res.sendFile(path.join(__dirname+'/old-site/index.html'));
});
router.post('/search', function(req, res, next){
	console.log("We got a search request!");
	var query = createSearchQuery(req);
	console.log(query);
	mongoClient.connect(db_url,function(err,db){
			db.collection('inventory').find(query).limit(100).toArray(function(err,results){
					console.log(results);
					db.close;
					res.send(results);
			}); 
	});
});
router.post('/add', function(req, res, next){
	console.log("We got an add request!");
	var partName = req.body.partName;
	var cat = req.body.cat;
	var subCat = req.body.subCat;
	var partNum = req.body.partNum;
	var loc = req.body.loc;
	var val = req.body.val;
	var qty = req.body.qty;
	var notes = req.body.notes
	console.log(req.body);
	mongoClient.connect(db_url,function(err,db){
		db.collection('inventory').insert({partName:partName,cat:cat,subCat:subCat,partNum:partNum,loc:loc,qty:qty,amountCheckedOut:0,val:val,notes:notes});
		db.close;
		res.end();
	});
});
router.post('/login', 
  passport.authenticate('local', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  });
router.post('/delete', function(req, res, next){
	console.log("We got an delete request!");
	var _id = new ObjectID(req.body._id);
	console.log(_id);
	mongoClient.connect(db_url,function(err,db){
		db.collection('inventory').remove({_id:_id});
		db.close;
		res.end();
	});
});
router.post('/modify',function(req,res,next){
	var _id = new ObjectID(req.body._id);
	cat = req.body.cat;
	partName = req.body.partName;
	subCat = req.body.subCat;
	val = req.body.val;
	partNum = req.body.partNum;
	loc = req.body.loc;
	qty = req.body.qty;
	notes = req.body.notes;
	mongoClient.connect(db_url,function(err,db){
		db.collection('inventory').update({_id:_id},{$set:{
			cat : cat,
			partName : partName,
			subCat : subCat,
			val : val,
			partNum : partNum,
			loc : loc,
			qty : qty,
			notes : notes
		}});
		db.close();
		res.end();
	});
});
function createSearchQuery(req)
{
	if(req.body.cat==undefined||req.body.cat==null)
	{
		req.body.cat = "";
	}
	var partName = new RegExp('.*'+req.body.partName+'.*','i');
	var cat = new RegExp('.*'+req.body.cat+'.*','i');
	var subCat = new RegExp('.*'+req.body.subCat+'.*','i');
	var partNum = new RegExp('.*'+req.body.partNum+'.*','i');
	var loc = new RegExp('.*'+req.body.loc+'.*','i');
	var val = new RegExp('.*'+req.body.val+'.*','i');
	return {
			partName:partName,
			cat:cat,
			subCat:subCat,
			partNum:partNum,
			loc:loc,
			val:val
			}
}

module.exports = router;