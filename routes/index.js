var express = require('express');
var router = express.Router();
var db = require('mongodb').MongoClient;
var db_url = "mongodb://localhost:27017/e-club-db";
/* GET home page. */
router.get('/', function(req, res, next) {
	var inventory_res;
	db.connect(db_url,function(err,db){
		inventory_res = db.collection('inventory').find().toArray(function(err,docs){
			res.render('index', { title: 'Express', data:docs});
		});; 	
	});
});

module.exports = router;
