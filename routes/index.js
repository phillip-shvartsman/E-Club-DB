var express = require('express');
var router = express.Router();
var db = require('mongodb').MongoClient;
var db_url = "mongodb://localhost:27017/e-club-db";
var path = require("path");

/* GET home page. */
router.get('/', function(req, res, next) {
	/*var inventory_res;
	db.connect(db_url,function(err,db){
		inventory_res = db.collection('inventory').find().toArray(function(err,docs){
			res.render('index', { title: 'Electronics Club @ OSU', data:docs});
		});; 	
	});*/
	res.sendFile(path.join(__dirname+'/old-site/index.html'));
});
router.get('/lab-resources',function(req,res,next){
	var inventory_res;
	db.connect(db_url,function(err,db){
		inventory_res = db.collection('inventory').find().toArray(function(err,docs){
			res.render('index', { title: 'Electronics Club @ OSU', data:docs});
		});; 	
	});
});
router.post('/add', function(req, res, next){
	console.log("We got a request!");
	console.log(req.body);
	res.send("Got your message");
});
router.get('/officers',function(req,res,next){
	res.sendFile(path.join(__dirname+'/old-site/officers.html'))
});
router.get('/calendar',function(req,res,next){
	res.sendFile(path.join(__dirname+'/old-site/calendar.html'))
});
module.exports = router;


