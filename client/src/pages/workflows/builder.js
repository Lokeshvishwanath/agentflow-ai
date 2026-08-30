import { useState } from 'react';
import { useRouter } from 'next/router';
import { Zap, Loader2, Save, Play, ArrowRight } from 'lucide-react';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import WorkflowCanvas from '../../components/WorkflowCanvas';
import useWorkflowStore from '../../store/workflowStore';
import api from '../../services/api';

const EXAMPLE_PROMPTS = [
  'Send a welcome email via Gmail when a new user signs up',
  'Post a Slack notification when an invoice exceeds $1000',
  'Append form submissions to a Google Sheet and notify Discord',
  'Route support tickets by priority and send email confirmations',
];

export default function WorkflowBuilder() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [error, setError] = useState('');
  const { generateWorkflow, nodes, edges, clearCanvas } = useWorkflowStore();
  const router = useRouter();

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!prompt.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const wf = await generateWorkflow(prompt);
      setGenerated(wf);
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed');
    } finally { setGenerating(false); }
  };

  const handleSave = async () => {
    if (!generated) return;
    setSaving(true);
    try {
      const { data } = await api.post('/workflows', {
        name: generated.name || prompt.slice(0, 60),
        description: generated.description || `Generated from: "${prompt}"`,
        nodes, edges, status: 'draft',
      });
      router.push(`/workflows/${data.workflow._id || data.workflow.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex h-full">
          {/* Left panel */}
          <div className="w-96 bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} className="text-sky-400" />
                <h2 className="font-semibold text-white text-sm">AI Workflow Builder</h2>
              </div>
              <p className="text-xs text-slate-500">Describe your automation in plain English</p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <form onSubmit={handleGenerate}>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Send a Slack notification when a new row is added to Google Sheets..."
                  rows={5}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 resize-none"
                />
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                <button
                  type="submit" disabled={generating || !prompt.trim()}
                  className="w-full mt-3 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  {generating ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Zap size={14} /> Generate Workflow</>}
                </button>
              </form>

              {/* Examples */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Example prompts</p>
                <div className="space-y-2">
                  {EXAMPLE_PROMPTS.map((p, i) => (
                    <button key={i} onClick={() => setPrompt(p)}
                      className="w-full text-left text-xs text-slate-400 hover:text-sky-400 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 transition-colors flex items-start gap-2">
                      <ArrowRight size={10} className="mt-0.5 flex-shrink-0" /> {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generated info */}
              {generated && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-emerald-400 text-xs font-medium mb-1">✓ Workflow generated</p>
                  <p className="text-white text-sm font-medium">{generated.name}</p>
                  <p className="text-slate-400 text-xs mt-1">{nodes.length} nodes · {edges.length} edges · via {generated.generatedBy}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {generated && (
              <div className="p-5 border-t border-slate-800 space-y-2">
                <button onClick={handleSave} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? 'Saving...' : 'Save Workflow'}
                </button>
                <button onClick={clearCanvas} className="w-full text-slate-400 hover:text-white text-sm py-2 transition-colors">
                  Clear canvas
                </button>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 h-full">
            <WorkflowCanvas />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
