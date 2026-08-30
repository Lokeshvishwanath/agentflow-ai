const axios = require('axios');
const { openrouterApiKey, geminiApiKey } = require('../config/env');

// ── Deterministic rule-based builder ─────────────────────────────────────────
const ruleBasedGenerate = (prompt) => {
  const p = prompt.toLowerCase();
  let nodes = [], edges = [];

  const node = (id, type, label, x, y, config = {}) => ({
    id, type: 'custom', position: { x, y },
    data: { label, nodeType: type, config },
  });

  if (p.includes('email') || p.includes('gmail')) {
    nodes = [
      node('trigger', 'trigger', 'Trigger', 100, 100),
      node('compose', 'ai', 'Compose Email', 350, 100, { prompt: 'Compose email based on input' }),
      node('send', 'gmail', 'Send Email', 600, 100, { to: '{{input.to}}', subject: '{{input.subject}}' }),
      node('done', 'output', 'Done', 850, 100),
    ];
    edges = [
      { id: 'e1', source: 'trigger', target: 'compose', animated: true },
      { id: 'e2', source: 'compose', target: 'send', animated: true },
      { id: 'e3', source: 'send', target: 'done', animated: true },
    ];
  } else if (p.includes('slack')) {
    nodes = [
      node('trigger', 'trigger', 'Trigger', 100, 100),
      node('format', 'ai', 'Format Message', 350, 100, { prompt: 'Format message for Slack' }),
      node('slack', 'slack', 'Post to Slack', 600, 100, { channel: '#general' }),
      node('done', 'output', 'Done', 850, 100),
    ];
    edges = [
      { id: 'e1', source: 'trigger', target: 'format', animated: true },
      { id: 'e2', source: 'format', target: 'slack', animated: true },
      { id: 'e3', source: 'slack', target: 'done', animated: true },
    ];
  } else if (p.includes('discord')) {
    nodes = [
      node('trigger', 'trigger', 'Trigger', 100, 100),
      node('format', 'ai', 'Format Message', 350, 100, { prompt: 'Format message for Discord' }),
      node('discord', 'discord', 'Post to Discord', 600, 100, { channelId: '' }),
      node('done', 'output', 'Done', 850, 100),
    ];
    edges = [
      { id: 'e1', source: 'trigger', target: 'format', animated: true },
      { id: 'e2', source: 'format', target: 'discord', animated: true },
      { id: 'e3', source: 'discord', target: 'done', animated: true },
    ];
  } else if (p.includes('sheet') || p.includes('spreadsheet')) {
    nodes = [
      node('trigger', 'trigger', 'Trigger', 100, 100),
      node('transform', 'ai', 'Transform Data', 350, 100, { prompt: 'Transform data for spreadsheet' }),
      node('sheet', 'google-sheets', 'Append to Sheet', 600, 100, { spreadsheetId: '', range: 'Sheet1!A:Z' }),
      node('done', 'output', 'Done', 850, 100),
    ];
    edges = [
      { id: 'e1', source: 'trigger', target: 'transform', animated: true },
      { id: 'e2', source: 'transform', target: 'sheet', animated: true },
      { id: 'e3', source: 'sheet', target: 'done', animated: true },
    ];
  } else if (p.includes('invoice')) {
    nodes = [
      node('trigger', 'trigger', 'Invoice Received', 100, 100),
      node('extract', 'ai', 'Extract Invoice Data', 350, 100, { prompt: 'Extract invoice fields' }),
      node('route', 'condition', 'Route by Amount', 600, 100, { condition: '{{amount}} > 1000' }),
      node('approve', 'slack', 'Request Approval', 850, 50, { channel: '#approvals' }),
      node('log', 'google-sheets', 'Log to Sheet', 850, 200, { spreadsheetId: '', range: 'Invoices!A:Z' }),
      node('done', 'output', 'Done', 1100, 100),
    ];
    edges = [
      { id: 'e1', source: 'trigger', target: 'extract', animated: true },
      { id: 'e2', source: 'extract', target: 'route', animated: true },
      { id: 'e3', source: 'route', target: 'approve', animated: true, label: 'high' },
      { id: 'e4', source: 'route', target: 'log', animated: true, label: 'low' },
      { id: 'e5', source: 'approve', target: 'done', animated: true },
      { id: 'e6', source: 'log', target: 'done', animated: true },
    ];
  } else {
    nodes = [
      node('trigger', 'trigger', 'Start', 100, 100),
      node('process', 'ai', 'AI Process', 350, 100, { prompt }),
      node('done', 'output', 'Output', 600, 100),
    ];
    edges = [
      { id: 'e1', source: 'trigger', target: 'process', animated: true },
      { id: 'e2', source: 'process', target: 'done', animated: true },
    ];
  }

  return { nodes, edges, name: prompt.slice(0, 60), description: `Generated from: "${prompt}"`, generatedBy: 'rule-based' };
};

// ── OpenRouter ────────────────────────────────────────────────────────────────
const generateViaOpenRouter = async (prompt) => {
  const systemPrompt = `You are a workflow automation designer. Given a user description, return ONLY valid JSON with this structure:
{
  "name": "workflow name",
  "description": "brief description",
  "nodes": [{"id":"string","type":"custom","position":{"x":number,"y":number},"data":{"label":"string","nodeType":"trigger|ai|gmail|slack|discord|google-sheets|condition|output","config":{}}}],
  "edges": [{"id":"string","source":"string","target":"string","animated":true,"label":"optional"}]
}
Node types: trigger (start), ai (LLM step), gmail, slack, discord, google-sheets, condition (branching), output (end).
Space nodes 250px apart horizontally. Return ONLY the JSON object, no markdown.`;

  const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: 'openai/gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
    max_tokens: 2000,
  }, {
    headers: { Authorization: `Bearer ${openrouterApiKey}`, 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  const text = res.data.choices[0].message.content.trim();
  const json = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return { ...JSON.parse(json), generatedBy: 'openrouter' };
};

// ── Gemini ────────────────────────────────────────────────────────────────────
const generateViaGemini = async (prompt) => {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const fullPrompt = `You are a workflow automation designer. Given: "${prompt}"
Return ONLY valid JSON (no markdown) with: name, description, nodes (id,type:"custom",position:{x,y},data:{label,nodeType,config}), edges (id,source,target,animated,label).
nodeType values: trigger|ai|gmail|slack|discord|google-sheets|condition|output. Space nodes 250px apart.`;

  const result = await model.generateContent(fullPrompt);
  const text = result.response.text().trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return { ...JSON.parse(text), generatedBy: 'gemini' };
};

// ── Public API ────────────────────────────────────────────────────────────────
const generateWorkflow = async (prompt, user) => {
  if (openrouterApiKey) {
    try { return await generateViaOpenRouter(prompt); } catch (e) { console.warn('[ai] OpenRouter failed:', e.message); }
  }
  if (geminiApiKey) {
    try { return await generateViaGemini(prompt); } catch (e) { console.warn('[ai] Gemini failed:', e.message); }
  }
  return ruleBasedGenerate(prompt);
};

module.exports = { generateWorkflow };
