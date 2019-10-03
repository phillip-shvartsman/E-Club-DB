require('dotenv').config();

////EXPRESS////
var express = require('express');
var router = express.Router();
const mongoDB = require('../db/mongoDB');

const db = mongoDB.get();

router.use(require('cookie-parser')());
router.use(require('body-parser').urlencoded({ extended: true }));
router.use(require('express-session')({ secret: process.env.SESSIONSECRET, resave: false, saveUninitialized: false }));

const passport = require('passport');
require('../auth/auth');
router.use(passport.initialize());
router.use(passport.session());
var ObjectID = require('mongodb').ObjectID;

const isLoggedIn = require('../auth/isLoggedIn');

router.post('/add',async (req,res,next)=>{
    try {
        await db.collection('requests').insertOne(req.body);
        res.end();
    }
    catch(err){
        console.error('Error in /request/add endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

router.post('/get-all',isLoggedIn,async (req,res,next)=>{
    try {
        const results = await db.collection('requests').find({}).toArray();
        res.send(results);
    }
    catch(err){
        console.error('Error in /requests/get-all endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

router.post('/delete',isLoggedIn,async (req,res,next)=>{
    try {
        const _id = new ObjectID(req.body._id);
        await db.collection('requests').deleteOne({_id:_id});
        res.end();
    }catch(err){
        console.error('Error in /requests/delete endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

module.exports = router;