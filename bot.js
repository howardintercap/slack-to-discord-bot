const { WebClient } = require('@slack/web-api');
const axios          = require('axios');
const express        = require('express');

const slack          = new WebClient(process.env.SLACK_TOKEN);
const channelId = 'C06GXT5L508';
const discordWebhook = 'https://discord.com/api/webhooks/1369389077559771249/38_jy7oK0ecX1WL6CJLNi4fqSNsOJ8hcAstEfVqJHB4LnSbrM1zL6ZAtlscsrwo4pPJq';

const REG = /New Registration:\s+[*]?([\w.-]+\.box)[*]?/i;
let   lastTs  = (Date.now() / 1000).toString();
let   running = false;                        // prevent overlapping polls

const wait = ms => new Promise(r => setTimeout(r, ms));

async function safePost(payload) {
  while (true) {
    try {
      return await axios.post(discordWebhook, payload);
    } catch (e) {
      if (e.response?.status !== 429) throw e;
      const retryAfter = (e.response.data?.retry_after || 1) * 1000;
      await wait(retryAfter);                // back-off per Discord header
    }
  }
}

async function poll() {
  if (running) return;
  running = true;

  try {
    const { messages = [] } = await slack.conversations.history({
      channel:   channelId,
      oldest:    lastTs,
      inclusive: false,
      limit:     100
    });

    const newMsgs = messages
      .filter(m => parseFloat(m.ts) > parseFloat(lastTs))
      .sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));

    for (const m of newMsgs) {
      lastTs = m.ts;

      const match = m.text.match(REG);
      if (!match) continue;

      const domain = match[1].replace(/\*/g, '');

      await safePost({
        embeds: [{
          description: `${domain} was just registered!`,
          color: 0xffffff
        }]
      });

      await wait(2100);                      // keep <30 msgs/min & <5/2 s
    }
  } catch (err) {
    console.error('Error:', err.response?.data || err);
  } finally {
    running = false;
  }
}

poll();
setInterval(poll, 60_000);

// minimal HTTP endpoint for Render/UptimeRobot
const app  = express();
const PORT = process.env.PORT || 3000;
app.get('/', (_, res) => res.send('Slack-to-Discord bot is running.'));
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
