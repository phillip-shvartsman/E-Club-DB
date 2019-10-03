////USER IDENTIFICATION////
const mongoDB = require('../db/mongoDB');
const db = mongoDB.get();



function findById(id, cb, db) {
    process.nextTick(function() {
        var idx = id - 1;
        db.collection('admin').find({}).toArray(function(err,records){
            if (records[idx]) {
                cb(null, records[idx]);
            } else {
                cb(new Error('User ' + id + ' does not exist'));
            }
        });
    });
}
function findByUsername(username, cb, db) {
    process.nextTick(function() {
        db.collection('admin').find({}).toArray(function(err,records){
            for (var i = 0, len = records.length; i < len; i++) {
                var record = records[i];
                if (record.username === username) {
                    return cb(null, record);
                }
            }
            return cb(null, null);
        });
    });
}
//Used by login routes
var passport = require('passport');
var Strategy = require('passport-local').Strategy;

passport.use(new Strategy(
    function(username, password, cb) {
        findByUsername(username, function(err, user) {
            if (err) { return cb(err); }
            if (!user) { return cb(null, false); }
            if (user.password != password) { 
                return cb(null, false); }
            return cb(null, user);
        },db);
    }));
	
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
}); 

passport.deserializeUser(function(id, cb) {
    findById(id, function (err, user) {
        if (err) { return cb(err); }
        cb(null, user);
    },db);
});

module.export = passport;