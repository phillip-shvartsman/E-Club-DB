require('dotenv').config();

////EXPRESS////
var express = require('express');
var router = express.Router();
const mongoDB = require('../db/mongoDB');

const db = mongoDB.get();

router.use(require('cookie-parser')());
router.use(require('body-parser').urlencoded({ extended: true }));

//ObjectID class used to create mongo unique ID objects
var ObjectID = require('mongodb').ObjectID;

const auth = require('../auth/auth.js');

//////SIMPLE PART DB ENDPOINTS//////

////POST SEARCH////
//Take form data and build reg expressions then send it to the database
function createSearchQuery(req)
{
    if(req.body.cat==undefined||req.body.cat==null)
    {
        req.body.cat = '';
    }
    var partName = new RegExp('.*'+req.body.partName+'.*','i');
    var cat = new RegExp('.*'+req.body.cat+'.*','i');
    var subCat = new RegExp('.*'+req.body.subCat+'.*','i');
    var partNum = new RegExp('.*'+req.body.partNum+'.*','i');
    var loc = new RegExp('.*'+req.body.loc+'.*','i');
    var val = new RegExp('.*'+req.body.val+'.*','i');
    return {
        partName:partName,
        cat:cat,
        subCat:subCat,
        partNum:partNum,
        loc:loc,
        val:val
    };
}
//Find using regex
//req.body.partName : Part Name
//req.body.cat      : Catgory
//req.body.subCat   : subCat
//req.body.partNum  : Part number
//req.body.loc      : Location in the lab
//req.body.val      : Value eg 30K for a 30K resistor
router.post('/search', async (req, res, next) => {
    try{
        const query = createSearchQuery(req);
        const results = await db.collection('inventory').find(query).toArray();
        res.send(results);
    }
    catch(err){
        console.error('Error in /search endpoint.');
        console.error(err);
        res.status(500).end();
    }
    
});

router.post('/get-single-part', async(req,res,next)=>{
    try {
        const partID = new ObjectID(req.body._id);
        const result = await db.collection('inventory').find({_id:partID}).toArray();
        res.send(result[0]);
    }
    catch(err){
        console.error('Error in /get-single-part endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

////POST ADD////
//req.body.partName : Name of the part
//req.body.cat      : Category
//req.body.subCat   : Subcategory
//req.body.val      : Value
//req.body.partNum  : Part number
//req.body.loc      : Location
//req.body.qty      : Quantity
//req.body.notes    : Notes
//Inserted into the database with req.body removed
//unique _id is generated by mongodb
//amountCheckedOut added to default 0
//All names come from form names which are extracted using getFormData function from name attribute in HTML
router.post('/add', auth.validateToken,auth.validateAdmin, async (req, res, next)=>{
    //Simple insert
    try{
        //Set amountCheckOut to default zero, only entry that is not in user form
        req.body.amountCheckedOut=0;
        await db.collection('inventory').insertOne(req.body);
        res.end();
    }catch(err){
        console.error('Error in /add endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

////POST DELETE////
//req.body._id : Unique part id to delete
router.post('/delete',auth.validateToken,auth.validateAdmin, async (req, res, next) => {
    try{
        const _id = new ObjectID(req.body._id);
        await db.collection('inventory').deleteOne({_id:_id});
        res.end();
    }
    catch(err){
        console.error('Error in /delete endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

////POST MODIFY////
//req.body._id : Unique id for the part
//req.body     : New part informtion same format as add
router.post('/modify',auth.validateToken,auth.validateAdmin, async (req,res,next)=>{
    try{
        const _id = new ObjectID(req.body._id);
        delete req.body._id;
        await db.collection('inventory').updateOne({_id:_id},{$set:req.body});
        res.end();
    }
    catch(err){
        console.error('Error in /modify endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

module.exports = router;