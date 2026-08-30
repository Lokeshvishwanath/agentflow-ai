const axios = require('axios');
const { BaseIntegration } = require('./baseIntegration');

class GoogleSheetsIntegration extends BaseIntegration {
  async appendRow({ spreadsheetId, range, values }) {
    this.assertConnected();
    const res = await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append`,
      { values },
      {
        params: { valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS' },
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }
    );
    return { updatedRange: res.data.updates?.updatedRange, updatedRows: res.data.updates?.updatedRows };
  }

  async readRange({ spreadsheetId, range }) {
    this.assertConnected();
    const res = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    return { values: res.data.values || [], range: res.data.range };
  }
}

module.exports = { GoogleSheetsIntegration };
