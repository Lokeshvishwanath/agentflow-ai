import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Zap, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setValidationError('');
    if (form.password !== form.confirm) return setValidationError('Passwords do not match');
    if (form.password.length < 6) return setValidationError('Password must be at least 6 characters');
    try {
      await register(form.name, form.email, form.password);
      router.push('/dashboard');
    } catch {}
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center mx-auto mb-4">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-slate-400 text-sm mt-1">Join Agentflow AI</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          {displayError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full name</label>
              <input
                type="text" required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-11 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="Min 6 characters"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm password</label>
              <input
                type="password" required
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-sky-400 hover:text-sky-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
