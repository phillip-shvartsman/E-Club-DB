var express = require('express');
var router = express.Router();
var mongoClient = require('mongodb').MongoClient;
var db;
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

router.post('/login', 
  passport.authenticate('local', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  });
  
mongoClient.connect(db_url,
	{
	  poolSize: 20,
	  socketTimeoutMS: 480000,
	  keepAlive: 300000,
	  reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 0
	},
	function(err,database){
	if(err) throw err;
	db = database;
	createInventory();
});
/* GET home page. */
router.get('/', function(req, res, next) {
	/*db.collection('inventory').find().toArray(function(err,docs){
			db.close();*/
			res.render('index', { title: 'Electronics Club @ OSU', user:req.user});
		/*});; 	
	});*/
	//res.sendFile(path.join(__dirname+'/old-site/index.html'));
});
router.post('/search', function(req, res, next){
	console.log("We got a search request!");
	var query = createSearchQuery(req);
	console.log(query);
	db.collection('inventory').find(query).limit(100).toArray(function(err,results){
			if(err) throw err;
			db.close;
			console.log(results);
			res.send(results);
			
	}); 
});
router.post('/add', function(req, res, next){
	console.log("We got an add request!");
	req.body['amountCheckedOut']=0;
	db.collection('inventory').insert(req.body).then(function(result){
		db.close;
		res.end();
	});
});
router.post('/delete', function(req, res, next){
	console.log("We got an delete request!");
	var _id = new ObjectID(req.body._id);
	db.collection('inventory').remove({_id:_id}).then(function(){
		db.close;
		res.end();
	});
});
router.post('/modify',function(req,res,next){
	var _id = new ObjectID(req.body._id);
	delete req.body._id;
	db.collection('inventory').update({_id:_id},{$set:req.body}).then(function(result){
		db.close();
		res.end();
	});
});
router.post('/get-check-outs',function(req,res,next){
	console.log('We got a check-out request');
	db.collection('checkOut').find({checkedIn:false}).toArray(function(err,results){
		if(err) throw err;
			db.close;
			//console.log(results);
			res.send(results);
	});
});

router.post('/add-check-out',function(req,res,next){
	var _id;
	var data;
	req.body['checkedIn'] = false;
	
	var store = req.body;
	var strip_result =  Object.assign({},req.body);
	delete strip_result['fname'];
	delete strip_result['dateDue'];
	delete strip_result['_id'];
	delete strip_result['dNum'];
	delete strip_result['fNum'];
	delete strip_result['checkedIn'];
	delete strip_result['lname'];
	console.log(strip_result);
	var keys= Object.keys(strip_result);
	var index = 0;
	var size = keys.length-1;
	incParts(res,store,keys,index,size);
});
function incParts(res,store,keys,index,size)
{
	data = JSON.parse(store[keys[index]]);
	console.log(store);
	_id = new ObjectID(keys[index]);
	if(size==index)
	{
		db.collection('inventory').update({_id:_id},{$inc:{amountCheckedOut:parseInt(data['amountToCheckOut'],10)}}).then(function(result){
			db.collection('checkOut').insert(store).then(function(){
					db.close;
					res.end();
				});
		});
	}
	else
	{
		db.collection('inventory').update({_id:_id},{$inc:{amountCheckedOut:parseInt(data['amountToCheckOut'],10)}}).then(function(result){
			index = index + 1;
			incParts(res,store,keys,index,size);
		});
	}
}
router.post('/check-in-all',function(req,res,next){
	var checkOut_id = new ObjectID(req.body._id); //ID of the whole checkout
	var part_id; //ID of a single part
	db.collection('checkOut').find({_id:checkOut_id}).toArray().then(function(result){
		
		if(result.length==0)
		{
			console.log('Bad ID for check in');
			res.end();
			db.close();
		}
		else
		{
		store = Object.assign({},result[0]);
		strip_result = Object.assign({},result[0]);
		
		delete strip_result['fname'];
		delete strip_result['dateDue'];
		delete strip_result['_id'];
		delete strip_result['dNum'];
		delete strip_result['fNum'];
		delete strip_result['checkedIn'];
		delete strip_result['lname'];
		var keys = Object.keys(strip_result);
		var size = keys.length-1;
		var index = 0;
		decParts(res,store,keys,index,size,checkOut_id);
		}
	});
});
function decParts(res,store,keys,index,size,checkOut_id){
	part_id = new ObjectID(keys[index]);
	data = JSON.parse(store[keys[index]]);
	if(size==index)
	{
		db.collection('checkOut').update({_id:checkOut_id},{$set:{checkedIn:true}}).then(function(result){
			db.collection('checkOut').find({checkedIn:false}).toArray(function(err,results){
				if(err) throw err;
					db.close;
					//console.log(results);
					res.send(results);
			});
		});
	}
	else
	{
		db.collection('inventory').update({_id:part_id},{$inc:{amountCheckedOut:-1*parseInt(data['amountToCheckOut'],10)}}).then(function(result){
			index = index + 1;
			decParts(res,store,keys,index,size,checkOut_id);
		});
	}
};
router.post('/add-part-post-check-out',function(req,res,next){
	var checkOut_id = new ObjectID(req.body.checkOut_id);
	parts = req.body;
	var part_id;
	delete parts['checkOut_id'];
	var size = Object.keys(parts).length;
	var index = 1;
	for(var key in parts)
	{
		part_id = new ObjectID(key);
		data = JSON.parse(parts[key]);
		db.collection('inventory').update({_id:part_id},{$inc:{amountCheckedOut:parseInt(data['amountToCheckOut'],10)}}).then(function(result){
			query = {};
			query[key] = parts[key];
			console.log(index);
					console.log(size);
			db.collection('checkOut').update({_id:checkOut_id},{$set:query}).then(function(result){
				if(index == size)
				{
					db.collection('checkOut').find({$query:{checkedIn:false},$orderby:{fName:1}}).toArray(function(err, result) { //Send the results back
						res.send(result);
						db.close();
					});
				}
				else
				{
					index = index + 1;
					return Promise.resolve(db);
				}
				});
				
			});
			
	}
});
router.post('/check-in-part',function(req,res,next){
	var part_id = new ObjectID(req.body.part_id);
	var part_id_str = req.body.part_id;
	var checkOut_id = new ObjectID(req.body.checkOut_id);
	db.collection('checkOut').find({_id:checkOut_id}).toArray(function(err,result){
		if(err)
		{
			console.log(err);
			res.end();
		}
		if(result.length==0)
		{
			console.log('Bad ID for check in');
			res.end();
		}
		result = result[0];
		data = JSON.parse(result[part_id_str]);
		db.collection('inventory').update({_id:part_id},{$inc:{amountCheckedOut:-1*parseInt(data['amountToCheckOut'],10)}}).then(function(results){
			console.log(result);
			var unset = {}; //USEFUL TRICK TURN string value into key
			unset[part_id_str]="";
			db.collection('checkOut').update({_id:checkOut_id},{$unset:unset}).then(function(results){
				db.collection('checkOut').find({$query:{checkedIn:false},$orderby:{fName:1}}).toArray().then(function(result){ //Send the results back
					res.send(result);
					db.close();
				});
			});
			
		});
		
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
function createAdmin()
{
	db.createCollection("admin",{strict:true},function(err,res){
		if(err)
		{
			console.log("Admin collection already exists");
		}
		else
		{
			console.log("Admin collection created!");
		}
		createCheckOut();
	});
}
function createInventory()
{
	db.createCollection("inventory",{strict:true},function(err,res){
		if(err)
		{
			console.log("Inventory collection already exists");
		}
		else
		{
			console.log("inventory collection created");
		}
		createAdmin();
	});
}
function createCheckOut()
{
	db.createCollection("checkOut",{strict:true},function(err,res){
		if(err)
		{
			console.log("checkout collection already exists");
		}
		else
		{
			console.log("Checkout collection created!");
		}
		createCheckOutParts();
	});
}
function createCheckOutParts()
{
	db.createCollection("checkOutParts",{strict:true},function(err,res){
		if(err)
		{
			console.log("checkOutParts collection already exists");
		}
		else
		{
			console.log("checkOutParts collection created!");
		}
		db.close;
	});
}


module.exports = router;