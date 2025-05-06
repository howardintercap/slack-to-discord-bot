const { WebClient } = require('@slack/web-api');
const axios = require('axios');

const slack = new WebClient(process.env.SLACK_TOKEN);
const channelId = 'C06GXT5L508';
const discordWebhook = 'https://discord.com/api/webhooks/1369329871746105344/iSl1okWAQkvJ1nA2Dbh2OScuk_yjmeUdz03VTOk2yGHfzeMeTP9WNVWnZd-33ytNCADI';

let lastTs = null;

const REGISTRATION_RE = /New Registration:\s+(\S+)/i;

async function pollSlack() {
  try {
    const { messages } = await slack.conversations.history({
      channel: channelId,
      limit: 1,
    });

    const msg = messages[0];
    if (!msg || msg.ts === lastTs) return;

    lastTs = msg.ts;

    const match = msg.text.match(REGISTRATION_RE);
    if (!match) return;

    const domain = match[1].replace(/\*/g, '');
    await axios.post(discordWebhook, {
      content: `${domain} was just registered!`,
    });

    console.log('Sent to Discord:', domain);
  } catch (e) {
    console.error('Slack error:', e.response?.data || e);
  }
}

setInterval(pollSlack, 60_000);
