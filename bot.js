const { WebClient } = require('@slack/web-api');
const axios = require('axios');
const express = require('express');

const slack = new WebClient(process.env.SLACK_TOKEN);
// const channelId = 'C06GXT5L508';
// const discordWebhook = 'https://discord.com/api/webhooks/1369389077559771249/38_jy7oK0ecX1WL6CJLNi4fqSNsOJ8hcAstEfVqJHB4LnSbrM1zL6ZAtlscsrwo4pPJq';
const channelId = 'C08PFMRB36E';
const discordWebhook = 'https://discord.com/api/webhooks/1369329871746105344/iSl1okWAQkvJ1nA2Dbh2OScuk_yjmeUdz03VTOk2yGHfzeMeTP9WNVWnZd-33ytNCADI';

const REG = /New Registration:\s+[*]?([\w.-]+\.box)[*]?/i;
let lastTs = (Date.now() / 1000).toString();

console.log('Slack-to-Discord bot started...');

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
        embeds: [
          {
            description: `${domain} was just registered!`,
            color: 0xffffff
          }
        ]
      });



      console.log(`Sent to Discord: ${domain}`);
    }
  } catch (err) {
    console.error('Error:', err.response?.data || err);
  }
}

poll();
setInterval(poll, 60_000);

// Fake server to satisfy Render port requirement
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (_, res) => res.send('Slack-to-Discord bot is running.'));
app.listen(PORT, () => console.log(`Fake server listening on port ${PORT}`));
