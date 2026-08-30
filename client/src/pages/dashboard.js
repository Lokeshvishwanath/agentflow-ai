import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { GitBranch, Play, CheckCircle, XCircle, Zap, Plus, Clock } from 'lucide-react';
import AppShell from '../components/AppShell';
import MetricGrid from '../components/MetricGrid';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../services/api';

const STATUS_BADGE = {
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
  RUNNING: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  PENDING: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  CANCELLED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get('/workflows/dashboard').then(({ data }) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const metrics = stats ? [
    { label: 'Total Workflows', value: stats.totalWorkflows, icon: <GitBranch size={16} className="text-sky-400" />, iconBg: 'bg-sky-500/10' },
    { label: 'Active Workflows', value: stats.activeWorkflows, icon: <CheckCircle size={16} className="text-emerald-400" />, iconBg: 'bg-emerald-500/10' },
    { label: 'Total Executions', value: stats.totalExecutions, icon: <Play size={16} className="text-purple-400" />, iconBg: 'bg-purple-500/10' },
    { label: 'Success Rate', value: `${stats.successRate}%`, icon: <Zap size={16} className="text-amber-400" />, iconBg: 'bg-amber-500/10' },
  ] : Array(4).fill({ label: '...', value: '—' });

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Dashboard</h1>
              <p className="text-slate-400 text-sm mt-0.5">Operator console overview</p>
            </div>
            <div className="flex gap-3">
              <Link href="/workflows/builder" className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                <Zap size={14} /> AI Builder
              </Link>
              <Link href="/workflows" className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 text-sm px-4 py-2 rounded-lg transition-colors">
                <Plus size={14} /> New Workflow
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 animate-pulse h-24" />
              ))}
            </div>
          ) : (
            <MetricGrid metrics={metrics} />
          )}

          {/* Recent Executions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="font-semibold text-white text-sm">Recent Executions</h2>
              <Link href="/executions" className="text-sky-400 hover:text-sky-300 text-xs">View all</Link>
            </div>
            <div className="divide-y divide-slate-800">
              {!stats?.recentExecutions?.length ? (
                <div className="px-5 py-8 text-center text-slate-500 text-sm">
                  No executions yet. <Link href="/workflows" className="text-sky-400 hover:text-sky-300">Create a workflow</Link> to get started.
                </div>
              ) : stats.recentExecutions.map((exec, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[exec.status] || STATUS_BADGE.PENDING}`}>
                    {exec.status}
                  </span>
                  <span className="text-sm text-slate-300 flex-1 truncate">
                    {exec.workflowId?.name || exec.workflowId || 'Workflow'}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={11} /> {new Date(exec.createdAt || exec.startTime).toLocaleString()}
                  </span>
                  <Link href={`/executions/${exec._id || exec.id}`} className="text-xs text-sky-400 hover:text-sky-300">
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
