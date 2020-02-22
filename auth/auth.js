////USER IDENTIFICATION////
const mongoDB = require('../db/mongoDB');
const db = mongoDB.get();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const MobileDetect = require('mobile-detect');
require('dotenv').config();
const nodemailer = require('nodemailer');
const {google} = require('googleapis');
const ObjectID = require('mongodb').ObjectID;
const logger = require('../logs/logger');


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
    let user;
    try {
        user = await findByEmail(req.body.email.toLowerCase());
    }catch(err){
        logger.error('There was an error with a provided email.');
        logger.error(err,{user});
    }
    if(user){
        const valid = await bcrypt.compare(req.body.password,user.password);
        if(valid){
            //Don't send password in the JWT
            delete user.password;
            const newJWT = jwt.sign(user,process.env.COOKIESECRET,{ expiresIn: '15m' });
            res.cookie('jwt',newJWT);
            res.end();
        }else{
            logger.error('User used wrong password');
            res.status(500).send({message:'Invalid password.'});
        }
    }else{
        logger.error('Email used does not exist',{user});
        res.status(500).send({message:'Email does not exist'});
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
        logger.error('Incoming JWT is either invalid or expired',{err,incomingJWT});
        res.status(500).send({message:'Your authentication token is invalid or expired.'});
    }
}

function validateAdmin(req,res,next){
    if(res.locals.decoded.admin===true){
        return next();
    }else{
        logger.error('Someone tried to access an admin endpoint',{user:res.locals.decoded});
        res.status(403).send({message:'You are not on the admin account'});
    }
}
//Express Middleware function
async function renderPage(req,res,next){
    const incomingJWT = req.cookies.jwt;
    const md = new MobileDetect(req.headers['user-agent']);
    let partsInventory = [];
    try {
        if(md.mobile() === null){
            partsInventory = await db.collection('inventory').find({}).toArray();
        }else{
            partsInventory = await db.collection('inventory').find({}).limit(100).toArray();
        }
    }
    catch(err){
        logger.error('There was an issue in auth.renderPage',{err,incomingJWT,md,partsInventory});
        res.send(500).send({message:'Could not fetch the inventory'});
    }
    const load_data = {title: 'Electronics Club @ OSU Parts Inventory',partsInventory:partsInventory ,LIVEADDRESS:process.env.LIVEADDRESS, LIVE:process.env.LIVE };
    
    if(res.locals.resetPassword === undefined){
        load_data.showResetPassword = false;
    }else{
        load_data.valid_reset_link = res.locals.valid_reset_link;
        load_data.showResetPassword = true;
        load_data.resetPassword = res.locals.resetPassword;
        load_data.token = res.locals.token;
        load_data.userID = res.locals.userID;
    }
    try {
        const decoded = jwt.verify(incomingJWT,process.env.COOKIESECRET);
        load_data.user = true;
        load_data.admin = decoded.admin;
        load_data.email = decoded.email;
    } catch(err){
        if(err.message === 'jwt must be provided'){
            logger.info('Access with no JWT');
            logger.info(err);
        }
        else {
            logger.error('Problem decoding JWT.');
            logger.error(err);
        }
        load_data.admin = false;
        load_data.user = false;
        
    } finally{
        res.render('index', load_data);
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
        logger.error('The email sent here is invalid',{email});
        res.status(401).send({message:'This email is not a valid email.'});
    }
}
async function validatePassword(req,res,next){
    const password = req.body.password;
    const passwordConfirm = req.body.passwordConfirm;
    if(password.length>=8&&password.length<=32&&password===passwordConfirm){
        next();
    }else{
        logger.error('Passwords do not match or do not meet qualifications.',{password,passwordConfirm});
        res.status(401).send({message:'The password you used is not valid.'});
    }

}
async function validateUniqueEmail(req,res,next){
    const email = req.body.email;
    const sameEmail = await db.collection('users').find({email:email}).toArray();
    if(sameEmail.length===0){
        next();
    }else{
        if(sameEmail[0].temp === true){
            res.locals.tempUser = true;
            next();
        } else {
            logger.error('Email is not unique.',{email,sameEmail});
            res.status(409).send({message:'Email exists already'});
        }
    }
}
async function validateNameDotNum(req,res,next){
    const fName = req.body.fName;
    const lName = req.body.lName;
    const dNum = req.body.dNum;
    if(fName.length>1 && lName.length>1 && dNum>=0){
        next();
    }else{
        logger.error('fname,lname,dNum issue',{fName,lName,dNum});
        res.status(401).send({message:'The first name, last name, or dot number you provided is not valid.'});
    }
}
async function confirmMatchingEmail(req,res,next){
    req.body.confirmEmail = req.body.confirmEmail.toLowerCase();
    if(req.body.email===req.body.confirmEmail){
        next();
    } else{
        logger.error('Emails do not match.',{confirmEmail:req.body.confirmEmail,email:req.body.email});
        res.status(401).send({message:'Emails do not match'});
    }
}
async function addNewUserAdmin(req,res,next){
    const email = req.body.email;
    const tempUser = res.locals.tempUser;
    if(tempUser === true){
        res.status(401).send({message:'This temp user exists already.'});
    } else{
        await db.collection('users').insertOne({email:email,password:'',fName:'',lName:'',dNUm:'',admin:false,temp:true});
        res.status(200).end();
    }
}
async function createNewUser(req,res,next){
    const email = req.body.email;
    const password = req.body.password;
    const fName = req.body.fName;
    const lName = req.body.lName;
    const dNum = req.body.dNum;
    const tempUser = res.locals.tempUser;
    logger.info('Creating temp user',tempUser);
    try {
        const hash = await bcrypt.hash(password,10);
        if(tempUser  === true){
            await db.collection('users').updateOne({email:email},{$set:{email:email,password:hash,fName:fName,lName:lName,dNum:dNum,admin:false,temp:false}});
        }
        else {
            await db.collection('users').insertOne({email:email,password:hash,fName:fName,lName:lName,dNum:dNum,admin:false,temp:false});
        }
        next();
    }
    catch(err){
        logger.error('Problem inserting a new user.');
        logger.error(err,{email,password,fName,lName,dNum,tempUser});
        res.status(500).send({message:'Could not add you to the database'});
    }
}
async function refreshJWT(req,res,next){
    const user = res.locals.decoded;
    delete user['iat'];
    delete user['exp'];
    let newJWT;
    try {
        newJWT = jwt.sign(user,process.env.COOKIESECRET,{ expiresIn: '15m' });
    }catch(err){
        logger.error('Error signing JWT',{user});
    }
    res.cookie('jwt',newJWT);
    res.end();
}
async function resetPassword(req,res,next){
    const email = req.body.email;
    const result = await db.collection('users').find({email:email}).toArray();
    if(result.length>0){
        const user = result[0];
        const token = crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(token,10);
        try {
            await db.collection('users').updateOne({email:user.email},{$set:{password:hash}});
        }catch(err){
            logger.error('There was an issue with setting the password to the reset password');
            logger.error(err,{user,token,hash,email,result});
            res.status(500).send({message:'There was an error resetting your password.'});
        }
        let smtpTransport;
        let OAuth2;
        let oauth2Client;
        let accessToken;
        try {
            OAuth2 = google.auth.OAuth2;
            oauth2Client = new OAuth2(process.env.GMAIL_CLIENT_ID,process.env.GMAIL_CLIENT_SECRET,'https://developers.google.com/oauthplayground');
            oauth2Client.setCredentials({refresh_token:process.env.GMAIL_REFRESH_TOKEN});
            accessToken = oauth2Client.getAccessToken();
            smtpTransport = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: 'electronicsosu@gmail.com', 
                    clientId: process.env.GMAIL_CLIENT_ID,
                    clientSecret: process.env.GMAIL_CLIENT_SECRET,
                    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
                    accessToken: accessToken
                }
            });
        } catch(err){
            logger.error('There was an error in the Oauth2 pipeline for google');
            logger.error(err,{OAuth2,oauth2Client,accessToken});
            res.status(500).send({message:'There was an error sending the password reset email.'});
        }
        const html = '<p>To reset your password, follow this link:</p>' +
            '<a href="' + process.env.LIVEADDRESS + '/reset-password/' + user._id + '/' + token + '">' + 'https://www.inventory-e.club/' + 'reset-password/' + user._id + '/' + token + '</a>' +
            '<br><br>' +
            '<p>--Team</p>';
        

        const mailOptions = {
            from: 'electronicsosu@gmail.com',
            to: user.email,
            subject: 'Reset Password: E-Club Inventory',
            generateTextFromHTML: true,
            html: html
        };
        logger.info('Email will be sent with follow options.',{html,mailOptions});
        try {
            smtpTransport.sendMail(mailOptions, (error, response) => {
                error ? console.log(error) : console.log(response);
                smtpTransport.close();
                res.status(200).end();
            });
        } catch(err){
            logger.error('There was an error sending email');
            logger.error(err);
            res.status(500).send({message:'There was an issue sending your password reset email.'});
        }
        
    } else {
        res.status(500).send({message:'That email does not have an account.'});
    }
}
async function newPassword(req,res,next){
    try {
        const userID = ObjectID(req.params.user_id);
        const token = req.params.token;
        const user = await db.collection('users').find({_id:userID}).toArray();
        console.log(token);
        console.log(user[0].password);
        const valid = await bcrypt.compare(token,user[0].password);
        if(valid) {
            res.locals.showResetPassword = true;
            res.locals.resetPassword = true;
            res.locals.token = token;
            res.locals.userID = userID;
            res.locals.valid_reset_link = true;
        }else{
            res.locals.showResetPassword = false;
            res.locals.resetPassword = false;
            res.locals.valid_reset_link = false;
        }
        next();
    } catch(err)
    {
        logger.error(err);
        res.locals.showResetPassword = false;
        res.locals.resetPassword = false;
        res.locals.valid_reset_link = false;
        next();
    }
}
async function setNewPassword(req,res,next){
    /*const token = req.body.token;
    const userID = ObjectID(req.body.userID);
    const newPassword = req.body.newPassword;*/
    const userID = ObjectID(req.body.userID);
    const hash = await bcrypt.hash(req.body.password,10);
    let user;
    try {
        await db.collection('users').updateOne({_id:userID},{$set:{password:hash}});
        user = await db.collection('users').find({_id:userID}).toArray();
        res.send({email:user[0].email});
    }catch(err){
        console.log(err,{userID,hash,user});
        res.status(500).end();
    }
}
async function validateResetToken(req,res,next){
    const userID = ObjectID(req.body.userID);
    const token = req.body.token;
    try {
        const user = await db.collection('users').find({_id:userID}).toArray();
        if(user.length>0){
            const valid = await bcrypt.compare(token,user[0].password);
            if(valid){
                next();
            }else{
                logger.error('There was an error with a password reset token.');
                logger.error(token);
                logger.error(user);
                res.status(500).send({message:'There was a problem with your password reset token.'}); 
            }
        }else{
            logger.error('This user does not exist.0',{userID:userID,token:token});
            res.status(500).send({messge:'This is an invalid token.'});
        }
    } catch(err){
        logger.error('There was an error with a password reset token.');
        logger.error(err,{userID,token});
        res.status(500).send({message:'There was a problem with your password reset token.'});
    }
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
    refreshJWT,
    resetPassword,
    newPassword,
    setNewPassword,
    validateResetToken,
    confirmMatchingEmail,
    addNewUserAdmin
};
