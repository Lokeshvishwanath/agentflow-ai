import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Zap, GitBranch, Play, Plug, ArrowRight, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

const FEATURES = [
  { icon: Zap, title: 'AI Workflow Generation', desc: 'Describe automation in plain English — get a runnable graph instantly.' },
  { icon: GitBranch, title: 'Multi-Agent Orchestration', desc: 'Planner, Executor, Validator, Recovery, and Monitoring agents cooperate on every run.' },
  { icon: Play, title: 'Live Execution Streaming', desc: 'Watch every agent event stream in real time via Socket.IO.' },
  { icon: Plug, title: 'Real OAuth Integrations', desc: 'Gmail, Slack, Discord, and Google Sheets with encrypted credential storage.' },
];

export default function Landing() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-white">Agentflow AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Sign in</Link>
          <Link href="/register" className="bg-sky-500 hover:bg-sky-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5 text-sky-400 text-xs font-medium mb-8">
          <Zap size={12} /> Agentic AI Automation Platform
        </div>
        <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
          Automate anything with<br />
          <span className="text-sky-400">AI-powered agents</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Describe your automation in plain English. Watch it materialize as a visual workflow, execute through a chain of cooperating AI agents, and recover from failures automatically.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-xl font-medium transition-colors">
            Start building <ArrowRight size={16} />
          </Link>
          <Link href="/login" className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 px-6 py-3 rounded-xl font-medium transition-colors">
            Sign in
          </Link>
        </div>
      </section>

      {/* Agent chain showcase */}
      <section className="max-w-4xl mx-auto px-8 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Multi-Agent Orchestration</p>
          <div className="flex items-center gap-2 flex-wrap">
            {['Planner', 'Executor', 'Validator', 'Recovery', 'Monitoring'].map((agent, i) => (
              <div key={agent} className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  i === 0 ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' :
                  i === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                  i === 2 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                  i === 3 ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                  'bg-purple-500/10 border-purple-500/30 text-purple-400'
                }`}>{agent} Agent</div>
                {i < 4 && <ArrowRight size={12} className="text-slate-600" />}
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {[
              { agent: 'planner', color: 'text-sky-400', msg: 'Planned 4 nodes with confidence 92%' },
              { agent: 'execution', color: 'text-emerald-400', msg: 'Executing node: Send Email via Gmail' },
              { agent: 'validation', color: 'text-amber-400', msg: 'Node output valid — messageId present' },
              { agent: 'monitoring', color: 'text-purple-400', msg: 'Workflow execution completed successfully' },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className={`font-mono font-medium ${e.color} w-20`}>[{e.agent}]</span>
                <span className="text-slate-400">{e.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center mb-4">
                <Icon size={18} className="text-sky-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 text-slate-600 text-sm border-t border-slate-800/50">
        Agentflow AI — Agentic Automation Platform
      </footer>
    </div>
  );
}
