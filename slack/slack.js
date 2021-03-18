require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const logger = require('../logs/logger');


async function sendTestMessage(){
    const slackToken = process.env.SLACKTOKEN;
    const slackChannel = process.env.SLACKCHANNELNAME;
    const web = new WebClient(slackToken);
    logger.info('Sending slack',{slackToken,slackChannel});
    try {
        // Use the `chat.postMessage` method to send a message from this app
        await web.chat.postMessage({
            channel: slackChannel,
            text: 'This is a test from node!',
        });
        logger.info('Sent slack test message',{slackChannel,slackToken});
    } catch (error) {
        logger.error('Error sending slack test message',{error,slackToken,slackChannel});
    }
}
async function sendMessage(message){
    const slackToken = process.env.SLACKTOKEN;
    const slackChannel = process.env.SLACKCHANNELNAME;
    const web = new WebClient(slackToken);
    try{
        // Use the `chat.postMessage` method to send a message from this app
        await web.chat.postMessage({
            channel: slackChannel,
            text: message,
        });
        logger.info('Sent slack message',{slackChannel,slackToken,slackMessage:message});
    } catch (error) {
        logger.error('Error sending slack message',{error,slackToken,slackChannel,slackMessage:message});
    }  
}


module.exports = {
    sendTestMessage,
    sendMessage
};