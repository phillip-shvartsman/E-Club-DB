////USER IDENTIFICATION////
const mongoDB = require('../db/mongoDB');
const db = mongoDB.get();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();


async function findByUsername(username){

    const users = await db.collection('users').find({}).toArray();
    console.log(username);
    for (let i = 0, len = users.length; i < len; i++) {
        const user = users[i];
        if (user.username === username) {
            return user;
        }
    }
}
//Express Middleware function
async function checkLoginCredentials(req,res,next){
    const user = await findByUsername(req.body.username);
    if(user){
        const valid = await bcrypt.compare(req.body.password,user.password);
        if(valid){
            //Don't send password in the JWT
            delete user.password;
            console.log(user);
            const newJWT = jwt.sign(user,process.env.COOKIESECRET,{ expiresIn: '2h' });
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
    try {
        const decoded = jwt.verify(incomingJWT,process.env.COOKIESECRET);
        res.render('index', { title: 'Electronics Club @ OSU', user:true, admin:decoded.admin });
    } catch(err){
        console.error('Problem decoding JWT.');
        console.error(err);
        res.render('index', { title: 'Electronics Club @ OSU', user:false, admin:false });
    }
    
}
module.exports = {
    checkLoginCredentials,
    validateToken,
    validateAdmin,
    renderPage
};
