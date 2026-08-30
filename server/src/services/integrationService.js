const { isMemory, getMemStore } = require('../config/db');
const Integration = require('../models/Integration');
const { encrypt, decrypt } = require('../integrations/baseIntegration');
const { v4: uuidv4 } = require('uuid');

const ownerId = (user) => user._id?.toString() || user.id;

const getIntegration = async (userId, provider) => {
  if (isMemory()) {
    return getMemStore().integrations.find(i => i.owner === userId && i.provider === provider) || null;
  }
  return Integration.findOne({ owner: userId, provider });
};

const listIntegrations = async (user) => {
  const providers = ['gmail', 'slack', 'discord', 'google-sheets'];
  if (isMemory()) {
    const store = getMemStore();
    return providers.map(provider => {
      const doc = store.integrations.find(i => i.owner === ownerId(user) && i.provider === provider);
      return { provider, isConnected: doc?.isConnected || false, scopes: doc?.scopes || [], expiresAt: doc?.expiresAt };
    });
  }
  const docs = await Integration.find({ owner: ownerId(user) });
  return providers.map(provider => {
    const doc = docs.find(d => d.provider === provider);
    return { provider, isConnected: doc?.isConnected || false, scopes: doc?.scopes || [], expiresAt: doc?.expiresAt };
  });
};

const upsertIntegration = async (userId, provider, { accessToken, refreshToken, scopes, expiresAt, metadata } = {}) => {
  const data = {
    isConnected: true,
    scopes: scopes || [],
    expiresAt,
    metadata,
    encryptedAccessToken: encrypt(accessToken),
    encryptedRefreshToken: encrypt(refreshToken),
  };

  if (isMemory()) {
    const store = getMemStore();
    const idx = store.integrations.findIndex(i => i.owner === userId && i.provider === provider);
    if (idx >= 0) { store.integrations[idx] = { ...store.integrations[idx], ...data }; return store.integrations[idx]; }
    const doc = { _id: uuidv4(), owner: userId, provider, ...data };
    store.integrations.push(doc);
    return doc;
  }
  return Integration.findOneAndUpdate(
    { owner: userId, provider },
    { $set: data },
    { upsert: true, new: true }
  );
};

const disconnectIntegration = async (userId, provider) => {
  if (isMemory()) {
    const store = getMemStore();
    const idx = store.integrations.findIndex(i => i.owner === userId && i.provider === provider);
    if (idx >= 0) store.integrations[idx].isConnected = false;
    return;
  }
  await Integration.findOneAndUpdate({ owner: userId, provider }, { $set: { isConnected: false } });
};

module.exports = { getIntegration, listIntegrations, upsertIntegration, disconnectIntegration };
