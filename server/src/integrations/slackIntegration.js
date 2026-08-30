const axios = require('axios');
const { BaseIntegration } = require('./baseIntegration');

class SlackIntegration extends BaseIntegration {
  async postMessage({ channel, text, blocks }) {
    this.assertConnected();
    const res = await axios.post('https://slack.com/api/chat.postMessage',
      { channel, text, blocks },
      { headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' } }
    );
    if (!res.data.ok) throw new Error(`Slack error: ${res.data.error}`);
    return { ok: true, ts: res.data.ts, channel: res.data.channel };
  }
}

module.exports = { SlackIntegration };
