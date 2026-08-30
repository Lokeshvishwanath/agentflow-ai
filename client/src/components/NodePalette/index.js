import { Mail, MessageSquare, Hash, Table, Zap, GitBranch, Play, Square } from 'lucide-react';

const NODE_TYPES = [
  { type: 'trigger', label: 'Trigger', icon: Play, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', desc: 'Start point' },
  { type: 'ai', label: 'AI Step', icon: Zap, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30', desc: 'LLM processing' },
  { type: 'gmail', label: 'Gmail', icon: Mail, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', desc: 'Send/read email' },
  { type: 'slack', label: 'Slack', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', desc: 'Post message' },
  { type: 'discord', label: 'Discord', icon: Hash, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30', desc: 'Bot message' },
  { type: 'google-sheets', label: 'Sheets', icon: Table, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', desc: 'Append/read rows' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', desc: 'Branch logic' },
  { type: 'output', label: 'Output', icon: Square, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30', desc: 'End point' },
];

export default function NodePalette() {
  const onDragStart = (e, nodeType) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="px-4 py-3 border-b border-slate-800">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Node Palette</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {NODE_TYPES.map(({ type, label, icon: Icon, color, bg, desc }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-grab active:cursor-grabbing ${bg} hover:opacity-80 transition-opacity select-none`}
          >
            <Icon size={14} className={color} />
            <div>
              <p className={`text-xs font-medium ${color}`}>{label}</p>
              <p className="text-[10px] text-slate-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { NODE_TYPES };
