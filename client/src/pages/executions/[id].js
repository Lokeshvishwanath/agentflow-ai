import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronLeft, Pause, Play, XCircle, Loader2, Clock } from 'lucide-react';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../services/api';
import { connectSocket, subscribeExecution, getSocket } from '../../services/socket';

const AGENT_COLORS = {
  planner: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  execution: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  validation: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  recovery: 'bg-red-500/10 text-red-400 border-red-500/20',
  monitoring: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const LEVEL_ICON = { info: '●', warning: '▲', error: '✕', success: '✓' };
const LEVEL_COLOR = { info: 'text-slate-400', warning: 'text-amber-400', error: 'text-red-400', success: 'text-emerald-400' };

const STATUS_BADGE = {
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
  RUNNING: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  PENDING: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  PAUSED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  CANCELLED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

export default function ExecutionDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [execution, setExecution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const [execRes, logsRes] = await Promise.all([
        api.get(`/executions/${id}`),
        api.get(`/executions/${id}/timeline`),
      ]);
      setExecution(execRes.data.execution);
      setLogs(logsRes.data.logs || []);
      setLoading(false);
    };

    fetchData();

    connectSocket();
    subscribeExecution(id);
    const socket = getSocket();

    socket.on('agent:event', (event) => {
      setLogs(prev => [...prev, event]);
    });
    socket.on('execution:completed', (e) => setExecution(prev => prev ? { ...prev, status: 'COMPLETED', ...e } : prev));
    socket.on('execution:failed', (e) => setExecution(prev => prev ? { ...prev, status: 'FAILED', error: e.error } : prev));
    socket.on('execution:paused', () => setExecution(prev => prev ? { ...prev, status: 'PAUSED' } : prev));
    socket.on('execution:resumed', () => setExecution(prev => prev ? { ...prev, status: 'RUNNING' } : prev));
    socket.on('execution:cancelled', () => setExecution(prev => prev ? { ...prev, status: 'CANCELLED' } : prev));

    return () => {
      socket.off('agent:event');
      socket.off('execution:completed');
      socket.off('execution:failed');
      socket.off('execution:paused');
      socket.off('execution:resumed');
      socket.off('execution:cancelled');
    };
  }, [id]);

  const handlePause = async () => { await api.post(`/executions/${id}/pause`); };
  const handleResume = async () => { await api.post(`/executions/${id}/resume`); };
  const handleCancel = async () => { if (confirm('Cancel this execution?')) await api.post(`/executions/${id}/cancel`); };

  if (loading) return (
    <ProtectedRoute><AppShell>
      <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-sky-400" /></div>
    </AppShell></ProtectedRoute>
  );

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-6 space-y-5 max-w-4xl">
          <div className="flex items-center gap-3">
            <Link href="/executions" className="text-slate-400 hover:text-white transition-colors"><ChevronLeft size={18} /></Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold text-white">Execution Timeline</h1>
                {execution && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[execution.status] || STATUS_BADGE.PENDING}`}>
                    {execution.status}
                  </span>
                )}
              </div>
              {execution && (
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <Clock size={11} />
                  Started {new Date(execution.startTime || execution.createdAt).toLocaleString()}
                  {execution.duration && ` · ${(execution.duration / 1000).toFixed(1)}s`}
                </p>
              )}
            </div>

            {/* Controls */}
            {execution?.status === 'RUNNING' && (
              <div className="flex gap-2">
                <button onClick={handlePause} className="flex items-center gap-1.5 text-xs border border-slate-700 hover:border-amber-500/50 text-slate-400 hover:text-amber-400 px-3 py-1.5 rounded-lg transition-colors">
                  <Pause size={12} /> Pause
                </button>
                <button onClick={handleCancel} className="flex items-center gap-1.5 text-xs border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg transition-colors">
                  <XCircle size={12} /> Cancel
                </button>
              </div>
            )}
            {execution?.status === 'PAUSED' && (
              <button onClick={handleResume} className="flex items-center gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                <Play size={12} /> Resume
              </button>
            )}
          </div>

          {/* Error banner */}
          {execution?.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {execution.error}
            </div>
          )}

          {/* Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Agent Events</h2>
              <span className="text-xs text-slate-500">{logs.length} events</span>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                {execution?.status === 'RUNNING' ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Waiting for agent events...
                  </div>
                ) : 'No events recorded'}
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-3 hover:bg-slate-800/20 transition-colors">
                    <div className="flex-shrink-0 pt-0.5">
                      <span className={`text-xs font-mono ${LEVEL_COLOR[log.level] || 'text-slate-400'}`}>
                        {LEVEL_ICON[log.level] || '●'}
                      </span>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${AGENT_COLORS[log.agent] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {log.agent}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300">{log.message}</p>
                      {log.nodeId && <p className="text-xs text-slate-500 mt-0.5">Node: {log.nodeId}</p>}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">Metadata</summary>
                          <pre className="text-xs text-slate-500 mt-1 bg-slate-800/50 rounded p-2 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-xs text-slate-600">
                      {new Date(log.timestamp || log.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
