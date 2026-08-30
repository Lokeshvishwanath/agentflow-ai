export default function MetricGrid({ metrics = [] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, i) => (
        <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">{m.label}</span>
            {m.icon && <div className={`p-2 rounded-lg ${m.iconBg || 'bg-sky-500/10'}`}>{m.icon}</div>}
          </div>
          <p className="text-2xl font-bold text-white">{m.value ?? '—'}</p>
          {m.sub && <p className="text-xs text-slate-500 mt-1">{m.sub}</p>}
          {m.trend !== undefined && (
            <p className={`text-xs mt-1 font-medium ${m.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {m.trend >= 0 ? '↑' : '↓'} {Math.abs(m.trend)}%
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
