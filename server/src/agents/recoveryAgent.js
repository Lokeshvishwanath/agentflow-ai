// Recovery Agent — classifies failures and decides action
const FAILURE_TYPES = {
  MISSING_FIELDS: 'MISSING_FIELDS',
  API_FAILURE: 'API_FAILURE',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  RATE_LIMIT: 'RATE_LIMIT',
  TRANSIENT: 'TRANSIENT',
  INTEGRATION_NOT_CONNECTED: 'INTEGRATION_NOT_CONNECTED',
};

const ACTIONS = {
  RETRY: 'retry_with_backoff',
  ESCALATE: 'escalate',
  SKIP: 'skip',
};

const classify = (error, validationResult) => {
  const msg = (error?.message || '').toLowerCase();
  const code = error?.code || '';

  if (code === 'INTEGRATION_NOT_CONNECTED' || msg.includes('not connected')) {
    return { type: FAILURE_TYPES.INTEGRATION_NOT_CONNECTED, action: ACTIONS.ESCALATE };
  }
  if (code === 'AUTH_EXPIRED' || msg.includes('auth') || msg.includes('unauthorized') || msg.includes('401')) {
    return { type: FAILURE_TYPES.AUTH_EXPIRED, action: ACTIONS.ESCALATE };
  }
  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many')) {
    return { type: FAILURE_TYPES.RATE_LIMIT, action: ACTIONS.RETRY };
  }
  if (msg.includes('timeout') || msg.includes('econnreset') || msg.includes('network')) {
    return { type: FAILURE_TYPES.TRANSIENT, action: ACTIONS.RETRY };
  }
  if (validationResult && !validationResult.valid) {
    return { type: FAILURE_TYPES.MISSING_FIELDS, action: ACTIONS.RETRY };
  }
  if (msg.includes('500') || msg.includes('server error')) {
    return { type: FAILURE_TYPES.API_FAILURE, action: ACTIONS.RETRY };
  }
  return { type: FAILURE_TYPES.API_FAILURE, action: ACTIONS.ESCALATE };
};

const recover = async (error, node, retryCount, validationResult) => {
  const { type, action } = classify(error, validationResult);
  const maxRetries = 3;
  const shouldRetry = action === ACTIONS.RETRY && retryCount < maxRetries;

  return {
    failureType: type,
    action: shouldRetry ? ACTIONS.RETRY : ACTIONS.ESCALATE,
    retryDelay: Math.pow(2, retryCount) * 1000,
    retryCount,
    maxRetries,
    message: shouldRetry
      ? `Retrying node ${node.id} (attempt ${retryCount + 1}/${maxRetries}) — ${type}`
      : `Escalating node ${node.id} — ${type}: ${error?.message}`,
  };
};

module.exports = { recover, FAILURE_TYPES, ACTIONS };
