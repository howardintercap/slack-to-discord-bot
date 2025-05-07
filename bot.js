const { WebClient } = require('@slack/web-api');
const axios = require('axios');
const fs = require('fs');
const express = require('express');

const slack = new WebClient(process.env.SLACK_TOKEN);
// const channelId = 'C06GXT5L508';
// const discordWebhook = 'https://discord.com/api/webhooks/1369389077559771249/38_jy7oK0ecX1WL6CJLNi4fqSNsOJ8hcAstEfVqJHB4LnSbrM1zL6ZAtlscsrwo4pPJq';
const channelId = 'C08PFMRB36E';
const discordWebhook = 'https://discord.com/api/webhooks/1369329871746105344/iSl1okWAQkvJ1nA2Dbh2OScuk_yjmeUdz03VTOk2yGHfzeMeTP9WNVWnZd-33ytNCADI';
const REG = /New Registration:\s+\*?([\w.-]+\.box)\*?/i;
const STATE_FILE = './last_ts.json';

function loadTs() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE)).lastTs; } catch { return 0; }
}
function saveTs(ts) {
  fs.writeFileSync(STATE_FILE, JSON.stringify({ lastTs: ts }));
}

let lastTs = loadTs();

async function initialCatchup() {
  if (lastTs) return;
  const res = await slack.conversations.history({ channel: channelId, limit: 200 });
  const m = res.messages.find(x => REG.test(x.text));
  if (!m) { lastTs = (Date.now() / 1000).toString(); saveTs(lastTs); return; }
  const domain = m.text.match(REG)[1];
  await axios.post(discordWebhook, { embeds: [{ description: `${domain} was just registered!`, color: 0xffffff }] });
  lastTs = m.ts;
  saveTs(lastTs);
}

async function poll() {
  try {
    const res = await slack.conversations.history({ channel: channelId, oldest: lastTs, inclusive: false, limit: 200 });
    const msgs = res.messages.filter(m => parseFloat(m.ts) > parseFloat(lastTs)).sort((a, b) => a.ts - b.ts);
    for (const m of msgs) {
      const match = m.text.match(REG);
      if (!match) continue;
      const domain = match[1];
      await axios.post(discordWebhook, { embeds: [{ description: `${domain} was just registered!`, color: 0xffffff }] });
      lastTs = m.ts;
    }
    if (msgs.length) saveTs(lastTs);
  } catch (e) { console.error(e.response?.data || e); }
}

(async () => {
  await initialCatchup();
  poll();
  setInterval(poll, 60_000);
})();

const app = express();
app.get('/', (_, res) => res.send('Slack-to-Discord bot is running.'));
const PORT = process.env.PORT || 3000;
app.listen(PORT);
