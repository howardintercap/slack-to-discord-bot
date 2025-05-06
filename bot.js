const { WebClient } = require('@slack/web-api');
const axios = require('axios');

const slackToken = process.env.SLACK_TOKEN;
const channelId = 'C06GXT5L508'; 
const discordWebhook = 'https://discord.com/api/webhooks/1369329871746105344/iSl1okWAQkvJ1nA2Dbh2OScuk_yjmeUdz03VTOk2yGHfzeMeTP9WNVWnZd-33ytNCADI'; // Paste full webhook URL here

const slack = new WebClient(slackToken);
let lastTs = null;

async function pollSlack() {
  try {
    const res = await slack.conversations.history({
      channel: channelId,
      limit: 1,
    });

    const msg = res.messages[0];
    if (!msg || msg.subtype || msg.ts === lastTs) return;

    lastTs = msg.ts;

    await axios.post(discordWebhook, {
      content: `Slack: ${msg.text}`
    });

    console.log('Sent to Discord:', msg.text);
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Slack error:', e.response?.data || e);
  }
}

setInterval(pollSlack, 60000); // Poll every 60 seconds

