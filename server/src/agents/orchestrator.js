const planner = require('./plannerAgent');
const executor = require('./executionAgent');
const validator = require('./validationAgent');
const recovery = require('./recoveryAgent');
const monitor = require('./monitoringAgent');

let langGraphStatus = 'not-installed';
try { require('@langchain/langgraph'); langGraphStatus = 'available'; } catch (_) {}

const run = async (execution, workflow, userId) => {
  const execId = execution._id?.toString() || execution.id;
  const wfId = workflow._id?.toString() || workflow.id;

  const log = (agent, level, message, metadata = {}, nodeId = null) =>
    monitor.log({ executionId: execId, workflowId: wfId, nodeId, agent, level, message, metadata });

  // ── Planner ──────────────────────────────────────────────────────────────
  await log('planner', 'info', 'Planning workflow execution...');
  const plan = await planner.plan(workflow, {});
  await log('planner', 'success', plan.message, { confidence: plan.confidence, nodeOrder: plan.nodeOrder });

  const context = { inputs: execution.inputs || {}, outputs: {}, lastOutput: null };
  const nodeMap = Object.fromEntries((workflow.nodes || []).map(n => [n.id, n]));

  // ── Execute each node ─────────────────────────────────────────────────────
  for (const nodeId of plan.nodeOrder) {
    const node = nodeMap[nodeId];
    if (!node) continue;

    await log('execution', 'info', `Executing node: ${node.data?.label || nodeId}`, { nodeType: node.data?.nodeType }, nodeId);

    let output, retryCount = 0, success = false;

    while (!success && retryCount <= 3) {
      try {
        output = await executor.executeNode(node, context, userId);

        // ── Validation ──────────────────────────────────────────────────────
        const validation = await validator.validate(node, output);
        await log('validation', validation.valid ? 'success' : 'warning',
          validation.valid ? `Node ${nodeId} output valid` : `Validation issues: ${validation.issues.join(', ')}`,
          validation, nodeId);

        if (!validation.valid && retryCount < 3) {
          const rec = await recovery.recover(new Error(validation.issues[0]), node, retryCount, validation);
          await log('recovery', 'warning', rec.message, rec, nodeId);
          if (rec.action === recovery.ACTIONS.RETRY) { retryCount++; await sleep(rec.retryDelay); continue; }
        }

        context.outputs[nodeId] = output;
        context.lastOutput = output;
        success = true;
        await log('monitoring', 'success', `Node ${nodeId} completed`, { output }, nodeId);

      } catch (err) {
        const rec = await recovery.recover(err, node, retryCount, null);
        await log('recovery', 'error', rec.message, { error: err.message, ...rec }, nodeId);

        if (rec.action === recovery.ACTIONS.RETRY && retryCount < 3) {
          retryCount++;
          await sleep(rec.retryDelay);
        } else {
          await log('monitoring', 'error', `Node ${nodeId} failed: ${err.message}`, { error: err.message }, nodeId);
          throw Object.assign(err, { nodeId, failureType: rec.failureType });
        }
      }
    }
  }

  await log('monitoring', 'success', 'Workflow execution completed', { outputs: context.outputs });
  return { outputs: context.outputs, langGraph: langGraphStatus };
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = { run, langGraphStatus };
