require('dotenv').config();

////EXPRESS////
const express = require('express');
const router = express.Router();
const mongoDB = require('../db/mongoDB');

router.use(require('cookie-parser')());
router.use(require('body-parser').urlencoded({ extended: true }));

const auth = require('../auth/auth');



////LOGIN/LOGOUT ROUTES////
router.post('/login',auth.checkLoginCredentials,(req,res,next)=>{
    res.redirect('/');
});

router.get('/logout',function(req,res,next){
    res.clearCookie('jwt');
    res.redirect('/');
});

////GET HOME PAGE////
router.get('/', auth.renderPage);

module.exports = router;