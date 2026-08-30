require('dotenv').config();

const required = ['JWT_SECRET', 'CREDENTIAL_ENCRYPTION_KEY'];
required.forEach(key => {
  if (!process.env[key]) console.warn(`[env] WARNING: ${key} is not set`);
});

module.exports = {
  port: parseInt(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  redisUrl: process.env.REDIS_URL || '',
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  credentialEncryptionKey: process.env.CREDENTIAL_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/gmail/callback',
  },
  slack: {
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    redirectUri: process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/slack/callback',
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    botToken: process.env.DISCORD_BOT_TOKEN || '',
    redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/discord/callback',
  },
};
