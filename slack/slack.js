require('dotenv').config();
const { WebClient } = require('@slack/web-api');


async function sendTestMessage(){
    const slackToken = process.env.SLACKTOKEN;
    const slackChannel = process.env.SLACKCHANNELNAME;
    const web = new WebClient(slackToken);
    console.log(slackToken);
    try {
        // Use the `chat.postMessage` method to send a message from this app
        await web.chat.postMessage({
            channel: slackChannel,
            text: 'This is a test from node!',
        });
    } catch (error) {
        console.log(error);
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
    } catch (error) {
        console.log(error);
    }  
}


module.exports = {
    sendTestMessage,
    sendMessage
};