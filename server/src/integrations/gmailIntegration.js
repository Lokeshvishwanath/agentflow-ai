const axios = require('axios');
const { BaseIntegration } = require('./baseIntegration');

class GmailIntegration extends BaseIntegration {
  async sendEmail({ to, subject, body }) {
    this.assertConnected();
    // Build RFC 2822 message
    const raw = Buffer.from(
      `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
    ).toString('base64url');

    const res = await axios.post(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      { raw },
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    return { messageId: res.data.id, threadId: res.data.threadId };
  }

  async listMessages({ maxResults = 10, query = '' } = {}) {
    this.assertConnected();
    const res = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
      params: { maxResults, q: query },
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return res.data;
  }
}

module.exports = { GmailIntegration };
