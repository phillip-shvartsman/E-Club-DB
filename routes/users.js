require('dotenv').config();

////EXPRESS////
var express = require('express');
var router = express.Router();
const mongoDB = require('../db/mongoDB');
const db = mongoDB.get();
const logger = require('../logs/logger');

router.use(require('cookie-parser')());
router.use(require('body-parser').urlencoded({ extended: true }));


const auth = require('../auth/auth');
var ObjectID = require('mongodb').ObjectID;

router.post('/get-all',auth.validateToken,auth.validateAdmin,async(req,res,next)=>{
    try{
        //Get all the users from the db minus their passwords
        const users = await db.collection('users').find({},{password:0}).toArray();
        for(let i =0 ; i < users.length ; i = i + 1){
            const userID = ObjectID(users[i]._id);
            users[i].numCO = await db.collection('checkOut').find({userID:userID,type:{$ne:'returned'}}).count();
        }
        res.send({users:users});
    }catch(err){
        logger.error('Could not fetch users.');
        logger.error(err);
        res.status(500).send({message:'Error in get-all endpoint.'});
    }
});
router.post('/search',auth.validateToken,auth.validateAdmin,async(req,res,next)=>{
    const emailSearch = req.body.email;
    const limit = parseInt(req.body.limit);
    const emailRegExp = new RegExp('.*'+emailSearch+'.*','i');
    let results;
    try {
        results = await db.collection('users').find({email:emailRegExp},{password:0}).limit(limit).toArray();
        res.status(200).send({users:results});
    }catch(err){
        logger.error('Error in /users/search endpoint.');
        logger.error(err,{emailSearch,limit,emailRegExp,results});
    }
});
router.post('/add-new',auth.validateToken,auth.validateAdmin,auth.validateEmail,auth.confirmMatchingEmail,auth.validateUniqueEmail,auth.addNewUserAdmin);

module.exports = router;