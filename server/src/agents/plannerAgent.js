// Planner Agent — determines node execution order and emits confidence score
const plan = async (workflow, context) => {
  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];

  // Topological sort
  const inDegree = {};
  const adj = {};
  nodes.forEach(n => { inDegree[n.id] = 0; adj[n.id] = []; });
  edges.forEach(e => { adj[e.source]?.push(e.target); inDegree[e.target] = (inDegree[e.target] || 0) + 1; });

  const queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
  const order = [];
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    (adj[id] || []).forEach(t => { inDegree[t]--; if (inDegree[t] === 0) queue.push(t); });
  }

  const confidence = nodes.length > 0 ? Math.min(0.95, 0.7 + (order.length / nodes.length) * 0.25) : 0.5;

  return {
    nodeOrder: order,
    confidence,
    totalNodes: nodes.length,
    message: `Planned ${order.length} nodes with confidence ${(confidence * 100).toFixed(0)}%`,
  };
};

module.exports = { plan };
