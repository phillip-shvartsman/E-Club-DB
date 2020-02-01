////USER IDENTIFICATION////
const mongoDB = require('../db/mongoDB');
const db = mongoDB.get();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();


async function findByEmail(email){

    const users = await db.collection('users').find({}).toArray();
    for (let i = 0, len = users.length; i < len; i++) {
        const user = users[i];
        if (user.email === email) {
            return user;
        }
    }
}
//Express Middleware function
async function checkLoginCredentials(req,res,next){
    //cast to lower case first.
    const user = await findByEmail(req.body.email.toLowerCase());
    if(user){
        const valid = await bcrypt.compare(req.body.password,user.password);
        if(valid){
            //Don't send password in the JWT
            delete user.password;
            const newJWT = jwt.sign(user,process.env.COOKIESECRET,{ expiresIn: '15m' });
            res.cookie('jwt',newJWT);
            res.end();
        }else{
            res.status(500).end();
        }
    }else{
        res.status(500).end();
    }

}

async function validateToken(req,res,next){
    const incomingJWT = req.cookies.jwt;
    try{
        const decoded = jwt.verify(incomingJWT,process.env.COOKIESECRET);
        //Pass the decoded jwt to the next middleware usually validateAdmin
        res.locals.decoded = decoded;
        return next();
    }catch(err){
        console.error(err);
        res.status(500).end();
    }
}

function validateAdmin(req,res,next){
    if(res.locals.decoded.admin===true){
        return next();
    }else{
        res.status(403).end();
    }
}
//Express Middleware function
async function renderPage(req,res,next){
    const incomingJWT = req.cookies.jwt;
    const partsInventory = await db.collection('inventory').find({}).toArray();
    try {
        const decoded = await jwt.verify(incomingJWT,process.env.COOKIESECRET);
        res.render('index', { title: 'Electronics Club @ OSU',partsInventory:partsInventory , user:true, admin:decoded.admin,email:decoded.email });
    } catch(err){
        console.error('Problem decoding JWT.');
        console.error(err);
        res.render('index', { title: 'Electronics Club @ OSU',partsInventory:partsInventory, user:false, admin:false });
    }   
}
async function validateEmail(req,res,next){
    //Cast email to lowercase
    req.body.email = req.body.email.toLowerCase();

    const email = req.body.email;
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(re.test(String(email).toLowerCase())){
        next();
    }else{
        res.status(401).end();
    }
}
async function validatePassword(req,res,next){
    const password = req.body.password;
    const passwordConfirm = req.body.passwordConfirm;
    if(password.length>=8&&password.length<=32&&password===passwordConfirm){
        next();
    }else{
        res.status(401).end();
    }

}
async function validateUniqueEmail(req,res,next){
    const email = req.body.email;
    const sameEmail = await db.collection('users').find({email:email}).toArray();
    if(sameEmail.length===0){
        next();
    }else{
        res.status(409).end();
    }
}
async function validateNameDotNum(req,res,next){
    const fName = req.body.fName;
    const lName = req.body.lName;
    const dNum = req.body.dNum;
    if(fName.length>1 && lName.length>1 && dNum>=0){
        next();
    }else{
        res.status(401).end();
    }
}
async function createNewUser(req,res,next){
    const email = req.body.email;
    const password = req.body.password;
    const fName = req.body.fName;
    const lName = req.body.lName;
    const dNum = req.body.dNum;
    const hash = await bcrypt.hash(password,10);
    const result = await db.collection('users').insertOne({email:email,password:hash,fName:fName,lName:lName,dNum:dNum,admin:false});
    next();
}
async function refreshJWT(req,res,next){
    const user = res.locals.decoded;
    delete user['iat'];
    delete user['exp'];
    const newJWT = jwt.sign(user,process.env.COOKIESECRET,{ expiresIn: '15m' });
    res.cookie('jwt',newJWT);
    res.end();
}
module.exports = {
    checkLoginCredentials,
    validateToken,
    validateAdmin,
    validateEmail,
    validatePassword,
    validateUniqueEmail,
    validateNameDotNum,
    createNewUser,
    renderPage,
    refreshJWT
};
