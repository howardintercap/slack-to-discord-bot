const { WebClient } = require('@slack/web-api');
const axios = require('axios');

const slack       = new WebClient(process.env.SLACK_TOKEN);
const channelId   = 'C06GXT5L508';
const discordHook = 'https://discord.com/api/webhooks/...';

const REG = /New Registration:\s+(\S+)/i;

async function pollSlack() {
  try {
    // always fetch the last 100 messages
    const { messages } = await slack.conversations.history({
      channel: channelId,
      limit: 100
    });

    for (const m of messages) {
      const match = m.text.match(REG);
      if (!match) continue;

      const domain = match[1].replace(/\*/g, '');
      await axios.post(discordHook, { content: `${domain} was just registered!` });
      console.log('Sent to Discord:', domain);
    }
  } catch (e) {
    console.error('Error:', e.response?.data || e);
  }
}

pollSlack();
setInterval(pollSlack, 60_000);
