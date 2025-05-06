const { WebClient } = require('@slack/web-api');
const axios = require('axios');

const slack          = new WebClient(process.env.SLACK_TOKEN);
// const channelId      = 'C06GXT5L508';
const channelId      = 'C08PFMRB36E';
const discordWebhook = 'https://discord.com/api/webhooks/1369329871746105344/iSl1okWAQkvJ1nA2Dbh2OScuk_yjmeUdz03VTOk2yGHfzeMeTP9WNVWnZd-33ytNCADI';

const REG = /New Registration:\s+(\S+)/i;
let lastTs = (Date.now() / 1000).toString();

async function poll() {
  try {
    const res = await slack.conversations.history({
      channel: channelId,
      oldest: lastTs,
      inclusive: false,
      limit: 100
    });
    const newMsgs = (res.messages || [])
      .filter(m => parseFloat(m.ts) > parseFloat(lastTs))
      .sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));

    for (const m of newMsgs) {
      lastTs = m.ts;
      const match = m.text.match(REG);
      if (!match) continue;

      const domain = match[1].replace(/\*/g, '');
      await axios.post(discordWebhook, {
        content: `${domain} was just registered!`
      });

      console.log(`Sent to Discord: ${domain}`);
    }
  } catch (err) {
    console.error('Error:', err.response?.data || err);
  }
}

poll();
setInterval(poll, 60_000);

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_, res) => res.send('Slack-to-Discord bot is running.'));
app.listen(PORT, () => console.log(`Fake server listening on port ${PORT}`));
