const { WebClient } = require('@slack/web-api');
const express = require('express');

const slack = new WebClient(process.env.SLACK_TOKEN);
const channelId = 'C06GXT5L508';

const app = express();
app.use(express.json());

app.post('/discord', async (req, res) => {
  try {
    const content = req.body?.content;
    if (!content) return res.status(400).send('No content');

    const match = content.match(/New Registration:\s*([\w.-]+\.box)\b/i);
    if (!match) return res.status(200).send('Not a registration message');

    const domain = match[1].replace(/\*$/, '');
    await slack.chat.postMessage({
      channel: channelId,
      text: `${domain} was just registered!`,
    });

    res.status(200).send('Posted to Slack');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.listen(3000, () => console.log('Listening on :3000'));
