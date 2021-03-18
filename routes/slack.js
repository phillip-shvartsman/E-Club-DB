require('dotenv').config();

////EXPRESS////
var express = require('express');
var router = express.Router();
const mongoDB = require('../db/mongoDB');
const slack = require('../slack/slack');
const db = mongoDB.get();
const logger = require('../logs/logger');

router.use(require('cookie-parser')());
router.use(require('body-parser').urlencoded({ extended: true }));


const auth = require('../auth/auth');
var ObjectID = require('mongodb').ObjectID;


router.post('/test-message',auth.validateToken,auth.validateAdmin,async (req, res, next) => {
    try {
        await slack.sendTestMessage();
        res.end();
    }catch(err){
        logger.error('Error in slack test message.');
        logger.error(err);
        res.status(500).end();
    }
});

module.exports = router;