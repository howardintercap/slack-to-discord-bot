const { WebClient } = require('@slack/web-api');
const axios = require('axios');

const slack = new WebClient(process.env.SLACK_TOKEN);
const channelId = 'C06GXT5L508';
const discordWebhook = 'https://discord.com/api/webhooks/1369329871746105344/iSl1okWAQkvJ1nA2Dbh2OScuk_yjmeUdz03VTOk2yGHfzeMeTP9WNVWnZd-33ytNCADI';

let lastMessage = '';

async function pollDiscordWebhook() {
  try {
    const res = await axios.get(discordWebhook);
    const content = res.data.content || '';

    if (content !== lastMessage) {
      const match = content.match(/New Registration:\s*([^\s]+\.box)/);
      if (match) {
        const domain = match[1].replace(/\*/g, '');
        await slack.chat.postMessage({
          channel: channelId,
          text: `${domain} was just registered!`,
        });
      }
      lastMessage = content;
    }
  } catch (err) {
    console.error('Polling failed:', err.message);
  }
}

pollDiscordWebhook();
setInterval(pollDiscordWebhook, 60_000);
