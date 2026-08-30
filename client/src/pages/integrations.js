import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Mail, MessageSquare, Hash, Table, CheckCircle, XCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../services/api';

const PROVIDERS = [
  { id: 'gmail', label: 'Gmail', icon: Mail, color: 'text-red-400', bg: 'bg-red-500/10', desc: 'Send and read emails via Gmail API' },
  { id: 'slack', label: 'Slack', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10', desc: 'Post messages to Slack channels' },
  { id: 'discord', label: 'Discord', icon: Hash, color: 'text-indigo-400', bg: 'bg-indigo-500/10', desc: 'Send bot messages to Discord channels' },
  { id: 'google-sheets', label: 'Google Sheets', icon: Table, color: 'text-green-400', bg: 'bg-green-500/10', desc: 'Append rows and read spreadsheet data' },
];

export default function Integrations() {
  const [integrations, setIntegrations] = useState({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState('');
  const [toast, setToast] = useState(null);
  const router = useRouter();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  useEffect(() => {
    const { connected, error } = router.query;
    if (connected) {
      showToast(`${connected} connected successfully!`, 'success');
      router.replace('/integrations', undefined, { shallow: true });
      fetchIntegrations();
    }
    if (error) {
      showToast(decodeURIComponent(error), 'error');
      router.replace('/integrations', undefined, { shallow: true });
    }
  }, [router.query.connected, router.query.error]);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/integrations');
      const map = {};
      (data.integrations || []).forEach(i => { map[i.provider] = i; });
      setIntegrations(map);
    } finally { setLoading(false); }
  };

  const handleConnect = (provider) => {
    setConnecting(provider);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    let token = '';
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) token = JSON.parse(raw)?.state?.token || '';
    } catch {}
    // Navigate directly — server auth middleware accepts ?token= for OAuth redirects
    window.location.href = `${apiBase}/integrations/oauth/${provider}/start?token=${encodeURIComponent(token)}`;
  };

  const handleDisconnect = async (provider) => {
    if (!confirm(`Disconnect ${provider}?`)) return;
    try {
      await api.delete(`/integrations/${provider}`);
      showToast(`${provider} disconnected`, 'info');
      fetchIntegrations();
    } catch (err) {
      showToast(err.response?.data?.message || 'Disconnect failed', 'error');
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-6 space-y-6">
          {/* Toast */}
          {toast && (
            <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl transition-all ${
              toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
              toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              'bg-sky-500/10 border-sky-500/30 text-sky-400'
            }`}>
              {toast.msg}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Integrations</h1>
              <p className="text-slate-400 text-sm mt-1">Connect third-party services to use in your workflows</p>
            </div>
            <button onClick={fetchIntegrations} className="p-2 text-slate-400 hover:text-white transition-colors" title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl h-40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PROVIDERS.map(({ id, label, icon: Icon, color, bg, desc }) => {
                const integration = integrations[id];
                const connected = integration?.isConnected;
                return (
                  <div key={id} className={`bg-slate-900 border rounded-xl p-5 transition-colors ${connected ? 'border-emerald-500/20' : 'border-slate-800 hover:border-slate-700'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon size={18} className={color} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm">{label}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        {connected ? (
                          <>
                            <CheckCircle size={13} className="text-emerald-400" />
                            <span className="text-xs text-emerald-400 font-medium">Connected</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} className="text-slate-500" />
                            <span className="text-xs text-slate-500">Not connected</span>
                          </>
                        )}
                      </div>
                    </div>

                    {connected && integration.scopes?.length > 0 && (
                      <p className="text-xs text-slate-600 mb-3 truncate">
                        Scopes: {integration.scopes.slice(0, 3).join(', ')}
                        {integration.scopes.length > 3 && ` +${integration.scopes.length - 3} more`}
                      </p>
                    )}

                    {connected && integration.expiresAt && (
                      <p className="text-xs text-slate-500 mb-3">
                        Expires: {new Date(integration.expiresAt).toLocaleDateString()}
                      </p>
                    )}

                    <div className="flex gap-2">
                      {connected ? (
                        <>
                          <button
                            onClick={() => handleConnect(id)}
                            disabled={connecting === id}
                            className="flex-1 text-xs border border-slate-700 hover:border-sky-500/50 text-slate-400 hover:text-sky-400 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            {connecting === id ? <Loader2 size={11} className="animate-spin" /> : <ExternalLink size={11} />}
                            Reconnect
                          </button>
                          <button
                            onClick={() => handleDisconnect(id)}
                            className="text-xs border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 px-3 py-2 rounded-lg transition-colors"
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleConnect(id)}
                          disabled={connecting === id}
                          className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                        >
                          {connecting === id ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                          Connect {label}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="font-semibold text-white text-sm mb-2">Security</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              All OAuth access and refresh tokens are encrypted at rest using AES-256-CBC before storage in the database.
              Tokens are never logged or returned in API responses. Missing or expired credentials surface as explicit
              <span className="text-amber-400 font-mono text-xs mx-1">INTEGRATION_NOT_CONNECTED</span> /
              <span className="text-amber-400 font-mono text-xs mx-1">AUTH_EXPIRED</span> errors in the execution timeline.
            </p>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
