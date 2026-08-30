const axios = require('axios');
const { openrouterApiKey, geminiApiKey } = require('../config/env');
const integrationService = require('../services/integrationService');

// Execute a single node
const executeNode = async (node, context, userId) => {
  const { nodeType, config = {} } = node.data || {};

  switch (nodeType) {
    case 'trigger':
      return { triggered: true, timestamp: new Date().toISOString(), input: context.inputs };

    case 'ai': {
      const prompt = interpolate(config.prompt || 'Process this data', context);
      if (openrouterApiKey) {
        const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
        }, { headers: { Authorization: `Bearer ${openrouterApiKey}` }, timeout: 30000 });
        return { result: res.data.choices[0].message.content, model: 'openrouter/gpt-4o-mini' };
      }
      if (geminiApiKey) {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const model = new GoogleGenerativeAI(geminiApiKey).getGenerativeModel({ model: 'gemini-1.5-flash' });
        const r = await model.generateContent(prompt);
        return { result: r.response.text(), model: 'gemini-1.5-flash' };
      }
      return { result: `[Simulated AI response for: ${prompt.slice(0, 50)}]`, model: 'simulated' };
    }

    case 'gmail': {
      const integration = await integrationService.getIntegration(userId, 'gmail');
      if (!integration?.isConnected) throw Object.assign(new Error('Gmail not connected'), { code: 'INTEGRATION_NOT_CONNECTED' });
      const { GmailIntegration } = require('../integrations/gmailIntegration');
      const gmail = new GmailIntegration(integration);
      return gmail.sendEmail({
        to: interpolate(config.to || '', context),
        subject: interpolate(config.subject || 'Automated Email', context),
        body: interpolate(config.body || context.lastOutput || '', context),
      });
    }

    case 'slack': {
      const integration = await integrationService.getIntegration(userId, 'slack');
      if (!integration?.isConnected) throw Object.assign(new Error('Slack not connected'), { code: 'INTEGRATION_NOT_CONNECTED' });
      const { SlackIntegration } = require('../integrations/slackIntegration');
      const slack = new SlackIntegration(integration);
      return slack.postMessage({
        channel: config.channel || '#general',
        text: interpolate(config.message || context.lastOutput || 'Automated message', context),
      });
    }

    case 'discord': {
      const integration = await integrationService.getIntegration(userId, 'discord');
      if (!integration?.isConnected) throw Object.assign(new Error('Discord not connected'), { code: 'INTEGRATION_NOT_CONNECTED' });
      const { DiscordIntegration } = require('../integrations/discordIntegration');
      const discord = new DiscordIntegration(integration);
      return discord.postMessage({
        channelId: config.channelId || '',
        content: interpolate(config.message || context.lastOutput || 'Automated message', context),
      });
    }

    case 'google-sheets': {
      const integration = await integrationService.getIntegration(userId, 'google-sheets');
      if (!integration?.isConnected) throw Object.assign(new Error('Google Sheets not connected'), { code: 'INTEGRATION_NOT_CONNECTED' });
      const { GoogleSheetsIntegration } = require('../integrations/googleSheetsIntegration');
      const sheets = new GoogleSheetsIntegration(integration);
      return sheets.appendRow({
        spreadsheetId: config.spreadsheetId || '',
        range: config.range || 'Sheet1!A:Z',
        values: [Object.values(context.lastOutput || { data: 'automated' })],
      });
    }

    case 'condition': {
      const condition = interpolate(config.condition || 'true', context);
      try {
        const result = Function(`"use strict"; return (${condition})`)();
        return { conditionResult: !!result, branch: result ? 'true' : 'false' };
      } catch {
        return { conditionResult: false, branch: 'false', error: 'Condition evaluation failed' };
      }
    }

    case 'output':
      return { output: context.lastOutput, completed: true };

    default:
      return { skipped: true, nodeType };
  }
};

const interpolate = (template, context) => {
  if (typeof template !== 'string') return template;
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const val = key.trim().split('.').reduce((o, k) => o?.[k], context);
    return val !== undefined ? val : `{{${key}}}`;
  });
};

module.exports = { executeNode };
