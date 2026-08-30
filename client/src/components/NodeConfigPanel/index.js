import { X } from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';

const FIELDS = {
  trigger: [{ key: 'triggerType', label: 'Trigger Type', type: 'select', options: ['manual', 'schedule', 'webhook'] }],
  ai: [
    { key: 'prompt', label: 'Prompt', type: 'textarea' },
    { key: 'model', label: 'Model', type: 'text', placeholder: 'openai/gpt-4o-mini' },
  ],
  gmail: [
    { key: 'to', label: 'To', type: 'text', placeholder: 'recipient@example.com' },
    { key: 'subject', label: 'Subject', type: 'text' },
    { key: 'body', label: 'Body', type: 'textarea' },
  ],
  slack: [
    { key: 'channel', label: 'Channel', type: 'text', placeholder: '#general' },
    { key: 'message', label: 'Message', type: 'textarea' },
  ],
  discord: [
    { key: 'channelId', label: 'Channel ID', type: 'text' },
    { key: 'message', label: 'Message', type: 'textarea' },
  ],
  'google-sheets': [
    { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text' },
    { key: 'range', label: 'Range', type: 'text', placeholder: 'Sheet1!A:Z' },
  ],
  condition: [{ key: 'condition', label: 'Condition', type: 'text', placeholder: '{{amount}} > 1000' }],
  output: [{ key: 'outputKey', label: 'Output Key', type: 'text', placeholder: 'result' }],
};

export default function NodeConfigPanel() {
  const { selectedNode, updateNodeData, setSelectedNode } = useWorkflowStore();
  if (!selectedNode) return null;

  const nodeType = selectedNode.data?.nodeType || 'trigger';
  const fields = FIELDS[nodeType] || [];
  const config = selectedNode.data?.config || {};

  const handleChange = (key, value) => {
    updateNodeData(selectedNode.id, { config: { ...config, [key]: value } });
  };

  return (
    <div className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div>
          <p className="text-sm font-semibold text-white">{selectedNode.data?.label || 'Node Config'}</p>
          <p className="text-xs text-slate-500 capitalize">{nodeType}</p>
        </div>
        <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Label</label>
          <input
            type="text"
            value={selectedNode.data?.label || ''}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>

        {fields.map(({ key, label, type, placeholder, options }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
            {type === 'textarea' ? (
              <textarea
                value={config[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none"
              />
            ) : type === 'select' ? (
              <select
                value={config[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="">Select...</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={config[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            )}
          </div>
        ))}

        <div className="pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-500">Use <code className="text-sky-400">{'{{variable}}'}</code> for dynamic values</p>
        </div>
      </div>
    </div>
  );
}
