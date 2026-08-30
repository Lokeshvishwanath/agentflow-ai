import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Clock, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../services/api';

const STATUS_BADGE = {
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
  RUNNING: 'bg-sky-500/10 text-sky-400 border-sky-500/20 animate-pulse',
  PENDING: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  RETRYING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PAUSED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  CANCELLED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

export default function ExecutionsList() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/executions', { params: { page, limit: 15, status: statusFilter || undefined } });
      setExecutions(data.executions || []);
      setPages(data.pages || 1);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchExecutions(); }, [page, statusFilter]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Executions</h1>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="">All statuses</option>
                {['PENDING','RUNNING','COMPLETED','FAILED','RETRYING','PAUSED','CANCELLED'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">Workflow</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Duration</div>
              <div className="col-span-3">Started</div>
              <div className="col-span-2">Actions</div>
            </div>

            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-slate-800/50 animate-pulse">
                  {[3,2,2,3,2].map((span, j) => (
                    <div key={j} className={`col-span-${span} h-4 bg-slate-800 rounded`} />
                  ))}
                </div>
              ))
            ) : executions.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                <Play size={32} className="mx-auto mb-3 text-slate-700" />
                No executions found
              </div>
            ) : executions.map((exec) => (
              <div key={exec._id || exec.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors items-center">
                <div className="col-span-3 text-sm text-slate-300 truncate">
                  {exec.workflowId?.name || exec.workflowId || 'Workflow'}
                </div>
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[exec.status] || STATUS_BADGE.PENDING}`}>
                    {exec.status}
                  </span>
                </div>
                <div className="col-span-2 text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={11} />
                  {exec.duration ? `${(exec.duration / 1000).toFixed(1)}s` : '—'}
                </div>
                <div className="col-span-3 text-xs text-slate-500">
                  {new Date(exec.startTime || exec.createdAt).toLocaleString()}
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Link href={`/executions/${exec._id || exec.id}`} className="text-xs text-sky-400 hover:text-sky-300">
                    Timeline
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 border border-slate-700 rounded-lg disabled:opacity-40 hover:border-slate-500 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm text-slate-400">{page} / {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-1.5 border border-slate-700 rounded-lg disabled:opacity-40 hover:border-slate-500 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
