require('dotenv').config();

////EXPRESS////
var express = require('express');
var router = express.Router();
const mongoDB = require('../db/mongoDB');

const db = mongoDB.get();

router.use(require('cookie-parser')());
router.use(require('body-parser').urlencoded({ extended: true }));

const auth = require('../auth/auth');

//ObjectID class used to create mongo unique ID objects
var ObjectID = require('mongodb').ObjectID;

router.post('/add-unapproved',auth.validateToken,async(req,res,next)=>{
    const userID = new ObjectID(res.locals.decoded._id);
    const partID = new ObjectID(req.body._id);
    //May come as text from the client
    const qty = parseInt(req.body.qty);
    try {
        //Check if the part exists in the inventory DB
        const parts = await db.collection('inventory').find({_id:partID}).toArray();
        if(parts.length>0){
            //Check to see if the user already has this part added to their checkout
            const matchingParts = await db.collection('checkOut').find({partID:partID,userID:userID,type:'unapproved'}).toArray();
            if(matchingParts.length>0){
                await db.collection('checkOut').updateOne({partID:partID,userID:userID,type:'unapproved'},{$inc:{amountToCheckOut:qty}});
                res.end();
            }else{
                await db.collection('checkOut').insertOne({partID:partID,userID:userID,type:'unapproved',amountToCheckOut:qty});
                res.end();
            }
        }else{
            throw new Error('Part with that _id doesn\'t exist');
        }
    }catch(err){
        console.error('Error in /add-unapproved endpoint.');
        console.error(err);
        res.status(500).send(err).end();
    }
});

//A checkout is stored in the db with just _id's and a quantity. This function gets part details for each checkout and sends it to the client.
async function getPartDetails(checkOuts){
    const detailedCheckOuts = [];
    for(let i = 0; i<checkOuts.length;i = i + 1){
        const partID = new ObjectID(checkOuts[i].partID);
        const detailedCheckOut = await db.collection('inventory').find({_id:partID}).toArray();
        detailedCheckOut[0].amountToCheckOut = checkOuts[i].amountToCheckOut;
        detailedCheckOut[0].type = checkOuts[i].type;
        detailedCheckOut[0].userID = checkOuts[i].userID;
        detailedCheckOut[0].partID = detailedCheckOut[0]._id;
        detailedCheckOut[0]._id = checkOuts[i]._id;
        detailedCheckOuts.push(detailedCheckOut[0]);
    }
    return detailedCheckOuts;
}
router.post('/approve-part',auth.validateToken,auth.validateAdmin,async(req,res,next)=>{
    const checkOutID = new ObjectID(req.body.checkOutID);
    try{
        await db.collection('checkOut').updateOne({_id:checkOutID,type:'unapproved'},{$set:{type:'approved'}});
        res.end();
    }catch(err){
        console.error('Error in /approve-part endpoint.');
        console.error(err);
        res.status(500).end();
    }
});
router.post('/unapprove-part',auth.validateToken,auth.validateAdmin,async (req,res,next) =>{
    const checkOutID = new ObjectID(req.body.checkOutID);
    try{
        await db.collection('checkOut').updateOne({_id:checkOutID,type:'approved'},{$set:{type:'unapproved'}});
        res.end();
    }catch(err){
        console.error('Error in /unapprove-part endpoint.');
        console.error(err);
        res.status(500).end();
    }
});
router.post('/set-part-out',auth.validateToken,auth.validateAdmin,async(req,res,next)=>{
    const checkOutID = new ObjectID(req.body.checkOutID);
    try{
        const checkOut = await db.collection('checkOut').find({_id:checkOutID,type:'approved'}).toArray();
        if(checkOut.length < 1){
            throw new Error('Invalid checkout ID');
        }
        const partID = new ObjectID(checkOut[0].partID);
        const amountToCheckOut = parseInt(checkOut[0].amountToCheckOut);
        await db.collection('inventory').updateOne({_id:partID},{$inc:{amountCheckedOut:amountToCheckOut}});
        await db.collection('checkOut').updateOne({_id:checkOutID,type:'approved'},{$set:{type:'out'}});
        res.end();
    }catch(err){
        console.error('Error in /set-part-out endpoint.');
        console.error(err);
        res.status(500).end();
    }
});
router.post('/check-part-in',auth.validateToken,auth.validateAdmin,async(req,res,next)=>{
    const checkOutID = new ObjectID(req.body.checkOutID);
    try{
        const checkOut = await db.collection('checkOut').find({_id:checkOutID,type:'out'}).toArray();
        if(checkOut.length < 1){
            throw new Error('Invalid checkout ID');
        }
        const partID = new ObjectID(checkOut[0].partID);
        const amountToCheckOut = parseInt(checkOut[0].amountToCheckOut);
        await db.collection('inventory').updateOne({_id:partID},{$inc:{amountCheckedOut:-1*amountToCheckOut}});
        await db.collection('checkOut').updateOne({_id:checkOutID,type:'out'},{$set:{type:'returned'}});
        res.end();
    }catch(err){
        console.error('Error in /check-part-in endpoint.');
        console.error(err);
        res.status(500).end();
    }
});
router.post('/get-user-check-outs',auth.validateToken,async(req,res,next)=>{
    const userID = new ObjectID(res.locals.decoded._id);
    try{
        const checkOuts = await db.collection('checkOut').find({userID:userID}).toArray();
        const detailedCheckOuts = await getPartDetails(checkOuts);
        res.send(detailedCheckOuts);
    }catch(err){
        console.error('Error in /get-user-checkouts endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

router.post('/modify-unapproved',auth.validateToken,async(req,res,next)=>{
    const userID = new ObjectID(res.locals.decoded._id);
    const checkOutID = new ObjectID(req.body._id);
    const qty = parseInt(req.body.qty);
    try{
        const results = await db.collection('checkOut').find({_id:checkOutID,type:'unapproved'}).toArray();
        if(results.length<1){
            throw new Error('Checkout ID does not exist.');
        }else{
            const checkOut = results[0];
            if(!userID.equals(new ObjectID(checkOut.userID))){
                throw new Error('The checkout that is being modified is not owned by the modifying user.');
            }else{
                await db.collection('checkOut').updateOne({userID:userID,_id:checkOutID,type:'unapproved'},{$set:{amountToCheckOut:qty}});
                res.end();
            }
        }
    }
    catch(err){
        console.error('Error in /modify-unapproved endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

router.post('/remove-unapproved',auth.validateToken, async(req,res,next)=>{
    const userID = new ObjectID(res.locals.decoded._id);
    const checkOutID = new ObjectID(req.body._id);
    try{
        const results = await db.collection('checkOut').find({_id:checkOutID,type:'unapproved'}).toArray();
        if(results.length<1){
            throw new Error('Checkout ID does not exist.');
        }else{
            const checkOut = results[0];
            if(!userID.equals(new ObjectID(checkOut.userID))){
                throw new Error('The checkout that is being modified is not owned by the modifying user.');
            }else{
                await db.collection('checkOut').deleteOne({userID:userID,_id:checkOutID,type:'unapproved'});
                res.end();
            }
        }
    }
    catch(err){
        console.error('Error in /modify-unapproved endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

module.exports = router;