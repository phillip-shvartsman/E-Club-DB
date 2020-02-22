require('dotenv').config();

////EXPRESS////
var express = require('express');
var router = express.Router();
const mongoDB = require('../db/mongoDB');

const db = mongoDB.get();

router.use(require('cookie-parser')());
router.use(require('body-parser').urlencoded({ extended: true }));

const auth = require('../auth/auth');
const slack = require('../slack/slack');
const logger = require('../logs/logger');

//ObjectID class used to create mongo unique ID objects
var ObjectID = require('mongodb').ObjectID;

async function partExists(partID){
    const parts = await db.collection('inventory').find({_id:partID}).toArray();
    if(parts.length>0) return true;
    else return false;
}
async function addUnapproved(userID,partID,qty){
    const matchingParts = await db.collection('checkOut').find({partID:partID,userID:userID,type:'unapproved'}).toArray();
    if(matchingParts.length>0){
        await db.collection('checkOut').updateOne({partID:partID,userID:userID,type:'unapproved'},{$inc:{amountToCheckOut:qty}});
    }else{
        await db.collection('checkOut').insertOne({partID:partID,userID:userID,type:'unapproved',amountToCheckOut:qty});
    }
}
async function approvePart(checkOutID,userID,partID){
    if(userID === undefined && partID === undefined) {
        await db.collection('checkOut').updateOne({_id:checkOutID,type:'unapproved'},{$set:{type:'approved'}});
    }else{
        await db.collection('checkOut').update({partID:partID,userID:userID,type:'unapproved'},{$set:{type:'approved'}});
    }

}

//User Endpoints
router.post('/add-unapproved',auth.validateToken,async(req,res,next)=>{
    const userID = new ObjectID(res.locals.decoded._id);
    const partID = new ObjectID(req.body._id);
    //May come as text from the client
    const qty = parseInt(req.body.qty);
    let unapprovedCheckOuts;
    let numCheckOuts;
    try {
        if(Number.isInteger(qty)===false){
            throw new Error('Input is not an integer: ' + req.body.qty);
        }
        if(await partExists(partID)){
            //Check to see if the user already has this part added to their checkout
            await addUnapproved(userID,partID,qty);
            unapprovedCheckOuts = await db.collection('checkOut').find({type:'unapproved'}).toArray();
            numCheckOuts = unapprovedCheckOuts.length;
            await slack.sendMessage('There is a new part check out waiting to be approved from: ' + res.locals.decoded.fName + ' ' + res.locals.decoded.lName + '. # Unapproved Checkouts: ' + numCheckOuts);
            res.end();
        }else{
            throw new Error('Part with that _id doesn\'t exist');
        }
    }catch(err){
        logger.error('Error in /add-unapproved endpoint.');
        logger.error(err,{userID,partID,qty,unapprovedCheckOuts,numCheckOuts});
        res.status(500).send(err).end();
    }
});

router.post('/get-user-check-outs',auth.validateToken,async(req,res,next)=>{
    const userID = new ObjectID(res.locals.decoded._id);
    let checkOuts;
    let detailedCheckOuts;
    try{
        checkOuts = await db.collection('checkOut').find({userID:userID}).toArray();
        detailedCheckOuts = await getPartDetails(checkOuts);
        res.send(detailedCheckOuts);
    }catch(err){
        logger.error('Error in /get-user-checkouts endpoint.');
        logger.error(err,{userID,checkOuts,detailedCheckOuts});
        res.status(500).end();
    }
});

router.post('/modify-unapproved',auth.validateToken,async(req,res,next)=>{
    const userID = new ObjectID(res.locals.decoded._id);
    const checkOutID = new ObjectID(req.body._id);
    const qty = parseInt(req.body.qty);
    let results;
    let checkOut;
    try{
        results = await db.collection('checkOut').find({_id:checkOutID,type:'unapproved'}).toArray();
        if(results.length<1){
            throw new Error('Checkout ID does not exist.');
        }else{
            checkOut = results[0];
            if(!userID.equals(new ObjectID(checkOut.userID))){
                throw new Error('The checkout that is being modified is not owned by the modifying user.');
            }else{
                await db.collection('checkOut').updateOne({userID:userID,_id:checkOutID,type:'unapproved'},{$set:{amountToCheckOut:qty}});
                res.end();
            }
        }
    }
    catch(err){
        logger.error('Error in /modify-unapproved endpoint.');
        logger.error(err,{userID,checkOutID,qty,results,checkOut});
        res.status(500).end();
    }
});

router.post('/remove-unapproved',auth.validateToken, async(req,res,next)=>{
    const userID = new ObjectID(res.locals.decoded._id);
    const checkOutID = new ObjectID(req.body._id);
    let results;
    let checkOut;
    try{
        results = await db.collection('checkOut').find({_id:checkOutID,type:'unapproved'}).toArray();
        if(results.length<1){
            throw new Error('Checkout ID does not exist.');
        }else{
            checkOut = results[0];
            if(!userID.equals(new ObjectID(checkOut.userID))){
                throw new Error('The checkout that is being modified is not owned by the modifying user.');
            }else{
                await db.collection('checkOut').deleteOne({userID:userID,_id:checkOutID,type:'unapproved'});
                res.end();
            }
        }
    }
    catch(err){
        logger.error('Error in /remove-unapproved endpoint.');
        logger.error(err,{userID,checkOutID,results,checkOut});
        res.status(500).end();
    }
});


//A checkout is stored in the db with just _id's and a quantity. This function gets part details for each checkout and sends it to the client.
async function getPartDetails(checkOuts){
    const detailedCheckOuts = [];
    for(let i = 0; i<checkOuts.length;i = i + 1){
        const partID = new ObjectID(checkOuts[i].partID);
        const detailedCheckOut = await db.collection('inventory').find({_id:partID}).toArray();
        logger.info(checkOuts[i]);
        logger.info(detailedCheckOut);
        detailedCheckOut[0].amountToCheckOut = checkOuts[i].amountToCheckOut;
        detailedCheckOut[0].type = checkOuts[i].type;
        detailedCheckOut[0].userID = checkOuts[i].userID;
        detailedCheckOut[0].partID = detailedCheckOut[0]._id;
        detailedCheckOut[0]._id = checkOuts[i]._id;
        detailedCheckOuts.push(detailedCheckOut[0]);
    }
    return detailedCheckOuts;
}


//Admin End Points
router.post('/approve-part',auth.validateToken,auth.validateAdmin,async(req,res,next)=>{
    const checkOutID = new ObjectID(req.body.checkOutID);
    try{
        await approvePart(checkOutID);
        res.end();
    }catch(err){
        logger.error('Error in /approve-part endpoint.');
        logger.error(err,{checkOutID});
        res.status(500).end();
    }
});
router.post('/unapprove-part',auth.validateToken,auth.validateAdmin,async (req,res,next) =>{
    const checkOutID = new ObjectID(req.body.checkOutID);
    try{
        await db.collection('checkOut').updateOne({_id:checkOutID,type:'approved'},{$set:{type:'unapproved'}});
        res.end();
    }catch(err){
        logger.error('Error in /unapprove-part endpoint.');
        logger.error(err,{checkOutID});
        res.status(500).end();
    }
});
router.post('/set-part-out',auth.validateToken,auth.validateAdmin,async(req,res,next)=>{
    const checkOutID = new ObjectID(req.body.checkOutID);
    let checkOut;
    let partID;
    let amountToCheckOut;
    try{
        checkOut = await db.collection('checkOut').find({_id:checkOutID,type:'approved'}).toArray();
        if(checkOut.length < 1){
            throw new Error('Invalid checkout ID');
        }
        partID = new ObjectID(checkOut[0].partID);
        amountToCheckOut = parseInt(checkOut[0].amountToCheckOut);
        await db.collection('inventory').updateOne({_id:partID},{$inc:{amountCheckedOut:amountToCheckOut}});
        await db.collection('checkOut').updateOne({_id:checkOutID,type:'approved'},{$set:{type:'out'}});
        res.end();
    }catch(err){
        logger.error('Error in /set-part-out endpoint.');
        logger.error(err,{checkOutID,checkOut,partID,amountToCheckOut});
        res.status(500).end();
    }
});
router.post('/check-part-in',auth.validateToken,auth.validateAdmin,async(req,res,next)=>{
    const checkOutID = new ObjectID(req.body.checkOutID);
    let checkOut;
    let partID;
    let amountToCheckOut;
    try{
        checkOut = await db.collection('checkOut').find({_id:checkOutID,type:'out'}).toArray();
        if(checkOut.length < 1){
            throw new Error('Invalid checkout ID');
        }
        partID = new ObjectID(checkOut[0].partID);
        amountToCheckOut = parseInt(checkOut[0].amountToCheckOut);
        await db.collection('inventory').updateOne({_id:partID},{$inc:{amountCheckedOut:-1*amountToCheckOut}});
        await db.collection('checkOut').updateOne({_id:checkOutID,type:'out'},{$set:{type:'returned'}});
        res.end();
    }catch(err){
        logger.error('Error in /check-part-in endpoint.');
        logger.error(err,{checkOutID,checkOut,partID,amountToCheckOut});
        res.status(500).end();
    }
});

async function getUsers(){
    return db.collection('users').find({admin:false},{_id:0,email:1,password:0,fName:1,lName:1,dNum:1,admin:0}).toArray();
}
//Simple gets everything in the checkouts collection
router.post('/get-check-outs',auth.validateToken,auth.validateAdmin,async(req,res,next)=>{
    let users;
    let checkOuts;
    let detailedCheckOut;
    try{
        users = await getUsers();
        checkOuts = await db.collection('checkOut').find({}).toArray();
        detailedCheckOut = await getPartDetails(checkOuts);
        res.send({users:users,detailedCheckOut:detailedCheckOut});
    }catch(err){
        logger.error('Error in /get-check-outs endpoint.');
        logger.error(err,{users,checkOuts,detailedCheckOut});
        res.status(500).end();
    }
});

router.post('/add-checkout-admin',auth.validateToken,auth.validateAdmin,async(req,res,next)=>{
    logger.info(req.body);
    const userEmail = req.body['user-email'].toLowerCase();
    const qty = parseInt(req.body.qty);
    const partID = ObjectID(req.body.partID);
    let user;
    if(partExists(partID)){
        try {
            user = await db.collection('users').find({email:userEmail}).toArray();
            if(user.length<1 || user.length>1){
                throw new Error('Did not get the correct amount of users.');
            } 
        }catch(err){
            logger.error('Error in add-checkout-admin endpoint');
            logger.error(err,{user,qty,userEmail,partID});
            res.status(500).send({message:'Error finding the user with the sent ID.'});
        }
        const userID = ObjectID(user[0]._id);
        try {
            await addUnapproved(userID,partID,qty);
        } catch(err){
            logger.error('Could not add unapproved.');
            logger.error(err,{userID,partID});
            res.status(500).send({messge:'Error adding the new unapproved check-outs.'});
        }
        try {
            await approvePart(null,userID,partID);
        }catch(err){
            logger.error('Could not approved newly added unapproved part');
            logger.error(err,{userID,partID});
            res.status(500).send({message:'Error approving the part.'});
        }
        res.status(200).end();
    } else{
        logger.error('Error in /add-check-out-admin');
        logger.error('Part ID does not exist',{partID});
        res.status(500).send({messge:'Part does not exist.'});
    }

});
module.exports = router;