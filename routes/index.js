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
router.post('/register',auth.validateEmail,auth.validatePassword,auth.validateUniqueEmail,auth.validateNameDotNum,auth.createNewUser,auth.checkLoginCredentials,async (req,res,next)=>{
    res.redirect('/');
});
router.get('/logout',function(req,res,next){
    res.clearCookie('jwt');
    res.redirect('/');
});
router.post('/refreshJWT',auth.validateToken,auth.refreshJWT);
router.post('/reset-password',auth.resetPassword);
router.post('/set-new-password',auth.validatePassword,auth.validateResetToken,auth.setNewPassword);

////GET HOME PAGE////
router.get('/', auth.renderPage);
///Reset Password////
router.get('/reset-password/:user_id/:token',auth.newPassword,auth.renderPage);



module.exports = router;