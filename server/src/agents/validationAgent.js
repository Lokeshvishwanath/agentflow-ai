// Validation Agent — verifies node output has required fields
const validate = async (node, output) => {
  const { nodeType } = node.data || {};
  const issues = [];

  if (output === null || output === undefined) {
    issues.push('Output is null or undefined');
  }

  if (nodeType === 'gmail' && !output?.messageId && !output?.simulated) {
    issues.push('Gmail: missing messageId in output');
  }
  if (nodeType === 'slack' && !output?.ok && !output?.simulated) {
    issues.push('Slack: response not ok');
  }
  if (nodeType === 'ai' && !output?.result) {
    issues.push('AI: missing result field');
  }

  return {
    valid: issues.length === 0,
    issues,
    nodeId: node.id,
    nodeType,
  };
};

module.exports = { validate };
