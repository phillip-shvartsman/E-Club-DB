require('dotenv').config();

////EXPRESS////
const express = require('express');
const router = express.Router();
const mongoDB = require('../db/mongoDB');

const db = mongoDB.get();

router.use(require('cookie-parser')());
router.use(require('body-parser').urlencoded({ extended: true }));
router.use(require('express-session')({ secret: process.env.SESSIONSECRET, resave: false, saveUninitialized: false }));

const isLoggedIn = require('../auth/isLoggedIn');

//ObjectID class used to create mongo unique ID objects
var ObjectID = require('mongodb').ObjectID;

const passport = require('passport');
require('../auth/auth');

router.use(passport.initialize());
router.use(passport.session());


////LOGIN/LOGOUT ROUTES////
router.post('/login', 
    passport.authenticate('local', { failureRedirect: '/' }),
    function(req, res) {
        res.redirect('/');
    });

router.get('/logout',function(req,res,next){
    req.logout();
    res.redirect('/');
});

////GET HOME PAGE////
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Electronics Club @ OSU', user:req.user});
});

module.exports = router;