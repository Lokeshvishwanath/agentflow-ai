const crypto = require('crypto');
const { credentialEncryptionKey } = require('../config/env');

const ALGO = 'aes-256-cbc';
const KEY = Buffer.from(credentialEncryptionKey.padEnd(32, '0').slice(0, 32));

const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (data) => {
  if (!data) return null;
  try {
    const [ivHex, encHex] = data.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8');
  } catch { return null; }
};

class BaseIntegration {
  constructor(integrationDoc) {
    this.doc = integrationDoc;
    this.accessToken = decrypt(integrationDoc?.encryptedAccessToken);
    this.refreshToken = decrypt(integrationDoc?.encryptedRefreshToken);
  }

  isConnected() { return !!this.doc?.isConnected && !!this.accessToken; }

  assertConnected() {
    if (!this.isConnected()) {
      throw Object.assign(new Error(`${this.doc?.provider || 'Integration'} not connected`), { code: 'INTEGRATION_NOT_CONNECTED' });
    }
  }
}

module.exports = { BaseIntegration, encrypt, decrypt };
