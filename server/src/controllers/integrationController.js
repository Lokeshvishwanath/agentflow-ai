const integrationService = require('../services/integrationService');
const { google: googleConfig, slack: slackConfig, discord: discordConfig, clientUrl } = require('../config/env');
const axios = require('axios');

const list = async (req, res, next) => {
  try {
    const integrations = await integrationService.listIntegrations(req.user);
    res.json({ success: true, integrations });
  } catch (err) { next(err); }
};

const status = async (req, res, next) => {
  try {
    const integrations = await integrationService.listIntegrations(req.user);
    res.json({ success: true, status: integrations });
  } catch (err) { next(err); }
};

// ── OAuth flows ───────────────────────────────────────────────────────────────
const oauthStart = (req, res) => {
  const { provider } = req.params;
  const userId = req.user._id?.toString() || req.user.id;
  const state = Buffer.from(JSON.stringify({ userId, provider })).toString('base64');

  const urls = {
    gmail: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleConfig.clientId}&redirect_uri=${encodeURIComponent(googleConfig.redirectUri)}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly')}&access_type=offline&prompt=consent&state=${state}`,
    'google-sheets': `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleConfig.clientId}&redirect_uri=${encodeURIComponent(googleConfig.redirectUri)}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/spreadsheets')}&access_type=offline&prompt=consent&state=${state}`,
    slack: `https://slack.com/oauth/v2/authorize?client_id=${slackConfig.clientId}&scope=chat:write,channels:read&redirect_uri=${encodeURIComponent(slackConfig.redirectUri)}&state=${state}`,
    discord: `https://discord.com/api/oauth2/authorize?client_id=${discordConfig.clientId}&redirect_uri=${encodeURIComponent(discordConfig.redirectUri)}&response_type=code&scope=bot%20identify&state=${state}`,
  };

  const url = urls[provider];
  if (!url) return res.status(400).json({ success: false, message: `Unknown provider: ${provider}` });

  // If client_id not configured, return helpful error
  if (
    (provider === 'gmail' || provider === 'google-sheets') && !googleConfig.clientId ||
    provider === 'slack' && !slackConfig.clientId ||
    provider === 'discord' && !discordConfig.clientId
  ) {
    return res.redirect(`${clientUrl}/integrations?error=${encodeURIComponent(`${provider} OAuth not configured — add credentials to server/.env`)}`);
  }

  res.redirect(url);
};

const oauthCallback = async (req, res) => {
  const { provider } = req.params;
  const { code, state, error } = req.query;

  if (error) return res.redirect(`${clientUrl}/integrations?error=${encodeURIComponent(error)}`);
  if (!code || !state) return res.redirect(`${clientUrl}/integrations?error=missing_code`);

  try {
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    let tokens = {};

    if (provider === 'gmail' || provider === 'google-sheets') {
      const r = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: googleConfig.clientId,
        client_secret: googleConfig.clientSecret,
        redirect_uri: googleConfig.redirectUri,
        grant_type: 'authorization_code',
      });
      tokens = {
        accessToken: r.data.access_token,
        refreshToken: r.data.refresh_token,
        expiresAt: new Date(Date.now() + r.data.expires_in * 1000),
        scopes: (r.data.scope || '').split(' '),
      };
    } else if (provider === 'slack') {
      const r = await axios.post('https://slack.com/api/oauth.v2.access', null, {
        params: {
          code,
          client_id: slackConfig.clientId,
          client_secret: slackConfig.clientSecret,
          redirect_uri: slackConfig.redirectUri,
        },
      });
      if (!r.data.ok) throw new Error(r.data.error);
      tokens = {
        accessToken: r.data.access_token,
        scopes: (r.data.scope || '').split(','),
      };
    } else if (provider === 'discord') {
      const params = new URLSearchParams({
        client_id: discordConfig.clientId,
        client_secret: discordConfig.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: discordConfig.redirectUri,
      });
      const r = await axios.post('https://discord.com/api/oauth2/token', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      tokens = {
        accessToken: r.data.access_token,
        refreshToken: r.data.refresh_token,
        expiresAt: new Date(Date.now() + r.data.expires_in * 1000),
        scopes: (r.data.scope || '').split(' '),
      };
    }

    await integrationService.upsertIntegration(userId, provider, tokens);
    res.redirect(`${clientUrl}/integrations?connected=${provider}`);
  } catch (err) {
    console.error('[oauth callback]', err.message);
    res.redirect(`${clientUrl}/integrations?error=${encodeURIComponent(err.message)}`);
  }
};

const oauthError = (req, res) => {
  res.redirect(`${clientUrl}/integrations?error=${encodeURIComponent(req.query.error || 'OAuth error')}`);
};

const create = async (req, res, next) => {
  try {
    const { provider, accessToken, refreshToken, scopes } = req.body;
    const userId = req.user._id?.toString() || req.user.id;
    await integrationService.upsertIntegration(userId, provider, { accessToken, refreshToken, scopes });
    res.json({ success: true, integration: { provider, isConnected: !!accessToken } });
  } catch (err) { next(err); }
};

const disconnect = async (req, res, next) => {
  try {
    const userId = req.user._id?.toString() || req.user.id;
    await integrationService.disconnectIntegration(userId, req.params.provider);
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { list, status, oauthStart, oauthCallback, oauthError, create, disconnect };
