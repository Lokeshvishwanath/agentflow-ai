import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Save, Play, Copy, Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import WorkflowCanvas from '../../components/WorkflowCanvas';
import NodePalette from '../../components/NodePalette';
import NodeConfigPanel from '../../components/NodeConfigPanel';
import useWorkflowStore from '../../store/workflowStore';
import api from '../../services/api';

export default function WorkflowEditor() {
  const router = useRouter();
  const { id } = router.query;
  const { currentWorkflow, nodes, edges, fetchWorkflow, saveWorkflow, isLoading } = useWorkflowStore();
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (id) fetchWorkflow(id);
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await saveWorkflow(id, { nodes, edges });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const handleExecute = async () => {
    if (!id) return;
    setExecuting(true);
    try {
      const { data } = await api.post(`/workflows/${id}/execute`);
      router.push(`/executions/${data.execution._id || data.execution.id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Execution failed');
    } finally { setExecuting(false); }
  };

  const handleDuplicate = async () => {
    const { data } = await api.post(`/workflows/${id}/duplicate`);
    router.push(`/workflows/${data.workflow._id || data.workflow.id}`);
  };

  if (isLoading && !currentWorkflow) {
    return (
      <ProtectedRoute><AppShell>
        <div className="flex items-center justify-center h-full">
          <Loader2 size={24} className="animate-spin text-sky-400" />
        </div>
      </AppShell></ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex flex-col h-full">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/50">
            <Link href="/workflows" className="text-slate-400 hover:text-white transition-colors">
              <ChevronLeft size={18} />
            </Link>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">{currentWorkflow?.name || 'Workflow Editor'}</h2>
              <p className="text-xs text-slate-500">{nodes.length} nodes · {edges.length} edges · v{currentWorkflow?.version || 1}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDuplicate} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs px-3 py-1.5 border border-slate-700 rounded-lg transition-colors">
                <Copy size={12} /> Duplicate
              </button>
              <button onClick={handleSave} disabled={saving}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}`}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={handleExecute} disabled={executing}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                {executing ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                {executing ? 'Starting...' : 'Execute'}
              </button>
            </div>
          </div>

          {/* Editor body */}
          <div className="flex flex-1 overflow-hidden">
            <NodePalette />
            <WorkflowCanvas />
            <NodeConfigPanel />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
