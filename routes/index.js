require('dotenv').config();

////EXPRESS////
var express = require('express');
var router = express.Router();
router.use(require('cookie-parser')());
router.use(require('body-parser').urlencoded({ extended: true }));
router.use(require('express-session')({ secret: 'supersecretsave', resave: false, saveUninitialized: false }));

////MONGODB CLIENT////
var mongoClient = require('mongodb').MongoClient;

//ObjectID class used to create mongo unique ID objects
var ObjectID = require('mongodb').ObjectID;

//The db itself.
var db;
var db_url = 'mongodb://localhost:' + process.env.DB_PORT;

const client = new mongoClient(db_url,
    {
        useNewUrlParser:true,
        useUnifiedTopology:true,
        poolSize: 20,
        socketTimeoutMS: 480000,
        keepAlive: 300000,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 0
    }
);

//Connect on server start and create the collections used by the app.
client.connect().then( async (client) => 
{
    try{
        db = await client.db(process.env.DB_NAME);

        //Insert the inventory collection if it doesn't exist
        if(!await db.listCollections({name:'inventory'}).hasNext()){
            await db.createCollection('inventory',{strict:true});
        }

        //On server restart read .env file to set username and password
        if(await db.listCollections({name:'admin'}).hasNext()){
            await db.dropCollection('admin');
        }
        await db.createCollection('admin',{strict:true});
        await db.collection('admin').insertOne({id:1,username:process.env.USERNAME,password:process.env.PASSWORD});

        //Create checkout collection
        if(!await db.listCollections({name:'checkOut'}).hasNext()){
            await db.createCollection('checkOut',{strict:true});
        }
        //Create checkout parts collection
        if(!await db.listCollections({name:'checkOutParts'}).hasNext()){
            await db.createCollection('checkOutParts',{strict:true});
        }
    }
    catch(err){
        console.error('Could not create MongoDB collections.');
        console.error(err);
    }
    
}).catch( err=>{
    console.error('Could not connect to MongoDB instance.');
    console.error(err);
});

////USER IDENTIFICATION////
//Used by login routes
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var auth = require('../auth');
passport.use(new Strategy(
    function(username, password, cb) {
        auth.users.findByUsername(username, function(err, user) {
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
    auth.users.findById(id, function (err, user) {
        if (err) { return cb(err); }
        cb(null, user);
    },db);
});

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
        const results = await db.collection('inventory').find(query).limit(100).toArray();
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
router.post('/add', async (req, res, next)=>{
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
router.post('/delete', async (req, res, next) => {
    try{
        const _id = new ObjectID(req.body._id);
        await db.collection('inventory').remove({_id:_id});
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
router.post('/modify', async (req,res,next)=>{
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

//////CHECKOUT ENDPOINTS//////

////POST GET-CHECK-OUTS////
//Simple gets everything in the checkouts collection
router.post('/get-check-outs', async(req,res,next)=>{
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
router.post('/add-check-out', async (req,res,next)=>{
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
router.post('/check-in-all',async (req,res,next)=>{
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
router.post('/add-part-post-check-out',async (req,res,next)=>{
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
router.post('/check-in-part',async (req,res,next)=>{
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
        checkOut = checkOut[0];
        const parts = checkOut.parts;
        
        for(var i =0 ; i < parts.length; i = i + 1){
            const partID = new ObjectID(parts[i]._id);
            const partArray = await db.collection('inventory').find({_id:partID}).toArray();
            checkOut.parts[i] = partArray[0];
        }
        res.send(checkOut);
    }
    catch(err){
        console.error('Error in /check-check-out endpoint.');
        console.error(err);
        res.status(500).end();
    }
});

module.exports = router;