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

//////CHECKOUT ENDPOINTS//////

////POST GET-CHECK-OUTS////
//Simple gets everything in the checkouts collection
router.post('/get-check-outs',auth.validateToken,auth.validateAdmin, async(req,res,next)=>{
    try{
        var results = await db.collection('checkOut').find({checkedIn:false}).toArray();
        for(var i = 0 ; i < results.length; i = i + 1){
            var checkOut = Object.assign({},results[i]);
            for(var j =0 ; j < checkOut.parts.length; j = j + 1){
                const partID = new ObjectID(checkOut.parts[j]._id);
                const partArray = await db.collection('inventory').find({_id:partID}).toArray();
                results[i].parts[j] = partArray[0];
            }
        }
        res.send(results);
    }catch(err){
        console.error('Error in /get-check-outs endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

////POST ADD-CHECK-OUT////
//Modify the part data to account for the change in the amount checked out
router.post('/add-check-out',auth.validateToken,auth.validateAdmin, async (req,res,next)=>{
    try{
        req.body.checkedIn = false;
        const checkOut = req.body;
        const results = await db.collection('checkOut').find({fNum:req.body.fNum,checkedIn:false}).toArray();
        if(results.length>0){
            res.status(409);
            res.send('This form number is already being used!');
        }else{
            for(var i = 0 ; i< checkOut.parts.length ; i = i + 1){
                var part_id = new ObjectID(checkOut.parts[i]._id);
                var part_amountToCheckOut = checkOut.parts[i].amountToCheckOut;
                await db.collection('inventory').updateOne({_id:part_id},{$inc:{amountCheckedOut:part_amountToCheckOut}});
            }
            await db.collection('checkOut').insertOne(checkOut);
            
        }
        res.end();
    }catch(err){
        console.error('Error in /add-check-out endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

////POST CHECK-IN-ALL////
router.post('/check-in-all',auth.validateToken,auth.validateAdmin,async (req,res,next)=>{
    try{
        const checkOutID = new ObjectID(req.body._id); //ID of the whole checkout
        //Get the current checkout, add [0] to grab object out of the array of one.
        var checkOut = await db.collection('checkOut').find({_id:checkOutID}).toArray();
        checkOut = checkOut[0];
        for(var i = 0; i< checkOut.parts.length; i = i + 1){
            var partID = new ObjectID(checkOut.parts[i]._id);
            var amountToCheckIn = -1*checkOut.parts[i].amountToCheckOut;
            await db.collection('inventory').updateOne({_id:partID},{$inc:{amountCheckedOut:amountToCheckIn}});
        }
        await db.collection('checkOut').updateOne({_id:checkOutID},{$set:{checkedIn:true}});
        res.end();
    }
    catch(err){
        console.error('Error in /check-in-all endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

////POST ADD-PART-POST-CHECK-OUT
//Expects req to contain a list of parts in a checkout
router.post('/add-part-post-check-out',auth.validateToken,auth.validateAdmin,async (req,res,next)=>{
    try{
        const checkOutID = new ObjectID(req.body.checkOut_id);
        const newParts = req.body.parts;
    
        var checkOut = await db.collection('checkOut').find({_id:checkOutID}).toArray();
        checkOut = checkOut[0];
        const currentParts = checkOut.parts;
        //Check to see if we already have some parts with the same _id checked out in the current check out.
        for(var i = 0; i < newParts.length; i = i + 1){
            const partID = new ObjectID(newParts[i]._id);
            //Should we add a new entry
            var newEntry = true;
            for(var j = 0 ; j < currentParts.length; j = j + 1 ){
                var currentPartID = new ObjectID(currentParts[j]._id);
                if(currentPartID.equals(partID)){
                    checkOut.parts[j].amountToCheckOut += newParts[i].amountToChecked; 
                    newEntry = false;
                }
            }
            if(newEntry === true){
                checkOut.parts.push(newParts[i]);
            }
    
    
            //Increment in inventory no matter what
            var amountToCheckOut = newParts[i].amountToCheckOut;
            await db.collection('inventory').updateOne({_id:partID},{$inc:{amountCheckedOut:amountToCheckOut}});
            
        }
        await db.collection('checkOut').deleteOne({_id:checkOutID});
        await db.collection('checkOut').insertOne(checkOut);
        res.end();
    }
    catch(err){
        console.error('Error in /add-part-post-check-out endpoint.');
        console.error(err);
        res.status(500).end();
    }

});

////POST CHECK-IN-PART////
//Check in a single part
router.post('/check-in-part',auth.validateToken,auth.validateAdmin,async (req,res,next)=>{
    try{
        const partID = new ObjectID(req.body.part_id);
        const checkOutID = new ObjectID(req.body.checkOut_id);
    
        var checkOut = await db.collection('checkOut').find({_id:checkOutID}).toArray();
        checkOut = checkOut[0];
        
        var indexToRemove;
        for(var i = 0; i < checkOut.parts.length; i = i + 1){
            const otherCurrentPartID = new ObjectID(checkOut.parts[i]._id);
             
            if(otherCurrentPartID.equals(partID)) {
                const amountToCheckIn = -1*checkOut.parts[i].amountToCheckOut;
                await db.collection('inventory').updateOne({_id:partID},{$inc:{amountCheckedOut:amountToCheckIn}});
                indexToRemove = i;
            }
        }
        checkOut.parts.splice(indexToRemove,1);
        await db.collection('checkOut').deleteOne({_id:checkOutID});
        await db.collection('checkOut').insertOne(checkOut);
        
        res.end();
    }
    catch(err){
        console.error('Error in /check-in-part endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

////POST CHECK-CHECK-OUT////
//Lets a user find their specific checkout using there lastname + dot number
function createSearchCheckOut(req)
{
    var lname = req.body.lname;
    var dNum = req.body.dNum;
    var searchedLname = new RegExp(lname,'i');
    return {
        dNum : dNum,
        lname:searchedLname,
        checkedIn:false
    };
}
//Expects 
//req.body.lname : Last name of user
//req.body.dNum  : Dot number of user
router.post('/check-check-out',async (req,res,next)=>{
    try{
        var query = createSearchCheckOut(req);
        var checkOut = await db.collection('checkOut').find(query).toArray();

        //No checkouts matching the provided information
        if(checkOut.length === 0){
            res.send();
        }
        else {
            checkOut = checkOut[0];
            const parts = checkOut.parts;
            
            for(var i =0 ; i < parts.length; i = i + 1){
                const partID = new ObjectID(parts[i]._id);
                const partArray = await db.collection('inventory').find({_id:partID}).toArray();
                checkOut.parts[i] = partArray[0];
            }
            res.send(checkOut);
        }
    }
    catch(err){
        console.error('Error in /check-check-out endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

module.exports = router;