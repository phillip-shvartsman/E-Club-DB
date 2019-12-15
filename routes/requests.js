require('dotenv').config();

////EXPRESS////
var express = require('express');
var router = express.Router();
const mongoDB = require('../db/mongoDB');

const db = mongoDB.get();

router.use(require('cookie-parser')());
router.use(require('body-parser').urlencoded({ extended: true }));


const auth = require('../auth/auth');
var ObjectID = require('mongodb').ObjectID;


router.post('/add',auth.validateToken,async (req,res,next)=>{
    try {
        const request = {
            email:res.locals.decoded.email,
            fName:res.locals.decoded.fName,
            lName:res.locals.decoded.lName,
            dNum:res.locals.decoded.dNum,
            userID:new ObjectID(res.locals.decoded._id),
            for:req.body.for,
            requestText:req.body.requestText,
            conversation:[]
        };
        await db.collection('requests').insertOne(request);
        res.end();
    }
    catch(err){
        console.error('Error in /request/add endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

router.post('/get-all',auth.validateToken,auth.validateAdmin,async (req,res,next)=>{
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

router.post('/delete',auth.validateToken,auth.validateAdmin,async (req,res,next)=>{
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

router.post('/get-user-requests',auth.validateToken,async(req,res,next)=>{
    try{
        const userID = new ObjectID(res.locals.decoded._id);
        const results = await db.collection('requests').find({userID:userID}).toArray();
        res.send(results);
    }catch(err){
        console.error('Error in /requests/get-user-requests endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

module.exports = router;