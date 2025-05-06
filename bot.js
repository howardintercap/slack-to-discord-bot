const { WebClient } = require('@slack/web-api');
const axios = require('axios');
const express = require('express');

const slack = new WebClient(process.env.SLACK_TOKEN);
const channelId = 'C06GXT5L508';
const app = express();

app.use(express.json());

app.post('/discord', async (req, res) => {
  try {
    const content = req.body?.content;
    if (!content) return res.status(400).send('No content');

    const match = content.match(/\*New Registration:\s*([^\*\s]+)\*/);
    if (!match) return res.status(200).send('No registration message');

    const domain = match[1];
    const message = `${domain} was just registered!`;

    await slack.chat.postMessage({
      channel: channelId,
      text: message,
    });

    res.status(200).send('Posted to Slack');
  } catch (error) {
    console.error('Error posting to Slack:', error);
    res.status(500).send('Internal error');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Bot listening on port ${port}`);
});
