import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, GitBranch, Play, Copy, Trash2, Clock, Zap } from 'lucide-react';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../services/api';

const STATUS_COLOR = { draft: 'text-slate-400', active: 'text-emerald-400', paused: 'text-amber-400', archived: 'text-red-400' };

export default function WorkflowsIndex() {
  const [workflows, setWorkflows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/workflows', { params: { search, page, limit: 12 } });
      setWorkflows(data.workflows || []);
      setPages(data.pages || 1);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchWorkflows(); }, [search, page]);

  const handleDuplicate = async (id) => {
    await api.post(`/workflows/${id}/duplicate`);
    fetchWorkflows();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this workflow?')) return;
    await api.delete(`/workflows/${id}`);
    fetchWorkflows();
  };

  const handleExecute = async (id) => {
    await api.post(`/workflows/${id}/execute`);
    alert('Execution started!');
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Workflows</h1>
            <div className="flex gap-3">
              <Link href="/workflows/builder" className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                <Zap size={14} /> AI Builder
              </Link>
            </div>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="Search workflows..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl h-36 animate-pulse" />)}
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-16">
              <GitBranch size={40} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No workflows yet</p>
              <Link href="/workflows/builder" className="bg-sky-500 hover:bg-sky-600 text-white text-sm px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2">
                <Zap size={14} /> Generate with AI
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((wf) => (
                <div key={wf._id || wf.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{wf.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{wf.description || 'No description'}</p>
                    </div>
                    <span className={`text-xs font-medium capitalize ml-2 ${STATUS_COLOR[wf.status] || 'text-slate-400'}`}>{wf.status}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                    <span>{wf.nodes?.length || 0} nodes</span>
                    <span>v{wf.version || 1}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(wf.updatedAt || wf.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/workflows/${wf._id || wf.id}`} className="flex-1 text-center text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg transition-colors">
                      Edit
                    </Link>
                    <button onClick={() => handleExecute(wf._id || wf.id)} className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors" title="Execute">
                      <Play size={14} />
                    </button>
                    <button onClick={() => handleDuplicate(wf._id || wf.id)} className="p-1.5 text-slate-400 hover:text-sky-400 transition-colors" title="Duplicate">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => handleDelete(wf._id || wf.id)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-slate-700 rounded-lg disabled:opacity-40 hover:border-slate-500 transition-colors">Prev</button>
              <span className="text-sm text-slate-400">{page} / {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1.5 text-sm border border-slate-700 rounded-lg disabled:opacity-40 hover:border-slate-500 transition-colors">Next</button>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
