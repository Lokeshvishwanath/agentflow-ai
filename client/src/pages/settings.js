import { useState } from 'react';
import { User, Shield, Key, Moon, Sun, Save, Loader2 } from 'lucide-react';
import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import useAuthStore from '../store/authStore';
import api from '../services/api';

export default function Settings() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiHealth, setApiHealth] = useState(null);

  const checkHealth = async () => {
    const { data } = await api.get('/health');
    setApiHealth(data);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Profile update would go here — for now just simulate
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-6 space-y-6 max-w-2xl">
          <h1 className="text-xl font-bold text-white">Settings</h1>

          {/* Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <User size={16} className="text-sky-400" />
              <h2 className="font-semibold text-white text-sm">Profile</h2>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full name</label>
                <input
                  type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                <input
                  type="email" value={form.email} disabled
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              <button type="submit" disabled={saving}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors ${saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saved ? 'Saved!' : saving ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </div>

          {/* Role & Security */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-sky-400" />
              <h2 className="font-semibold text-white text-sm">Security</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Role</span>
                <span className="text-white capitalize font-medium">{user?.role || 'operator'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Password hashing</span>
                <span className="text-emerald-400 text-xs">bcrypt · cost 12</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Token encryption</span>
                <span className="text-emerald-400 text-xs">AES-256-CBC</span>
              </div>
            </div>
          </div>

          {/* API Health */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-sky-400" />
                <h2 className="font-semibold text-white text-sm">System Health</h2>
              </div>
              <button onClick={checkHealth} className="text-xs text-sky-400 hover:text-sky-300 transition-colors">Check now</button>
            </div>
            {apiHealth ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">API Status</span>
                  <span className="text-emerald-400 font-medium">{apiHealth.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Version</span>
                  <span className="text-slate-300">{apiHealth.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Timestamp</span>
                  <span className="text-slate-500 text-xs">{new Date(apiHealth.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Click "Check now" to verify API connectivity</p>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
