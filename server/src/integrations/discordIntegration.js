const axios = require('axios');
const { BaseIntegration } = require('./baseIntegration');
const { discord } = require('../config/env');

class DiscordIntegration extends BaseIntegration {
  async postMessage({ channelId, content, embeds }) {
    this.assertConnected();
    const token = discord.botToken || this.accessToken;
    const res = await axios.post(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      { content, embeds },
      { headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' } }
    );
    return { messageId: res.data.id, channelId: res.data.channel_id };
  }
}

module.exports = { DiscordIntegration };
