const { WebClient } = require('@slack/web-api');
const axios = require('axios');

const slack = new WebClient(process.env.SLACK_TOKEN);
const channelId = 'C06GXT5L508';
const discordWebhook = 'https://discord.com/api/webhooks/...';

const REGISTRATION_RE = /New Registration:\s+(\S+)/i;

let lastTs = (Date.now() / 1000).toString();

async function pollSlack() {
  try {
    const res = await slack.conversations.history({
      channel: channelId,
      oldest: lastTs,
      inclusive: false,
      limit: 100
    });

    const msgs = (res.messages || [])
      .filter(m => parseFloat(m.ts) > parseFloat(lastTs))
      .sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));

    for (const msg of msgs) {
      const match = msg.text.match(REGISTRATION_RE);
      if (!match) continue;

      const domain = match[1].replace(/\*/g, '');
      await axios.post(discordWebhook, {
        content: `${domain} was just registered!`
      });
      console.log('Sent to Discord:', domain);

      lastTs = msg.ts;
    }
  } catch (err) {
    console.error('Slack error:', err.response?.data || err);
  }
}

pollSlack();
setInterval(pollSlack, 60_000);
