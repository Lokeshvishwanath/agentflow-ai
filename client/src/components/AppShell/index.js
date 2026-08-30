import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard, GitBranch, Play, Plug, Settings,
  Bell, LogOut, Menu, X, Zap, ChevronRight
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { connectSocket, subscribeUser, getSocket } from '../../services/socket';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/workflows', icon: GitBranch, label: 'Workflows' },
  { href: '/workflows/builder', icon: Zap, label: 'AI Builder' },
  { href: '/executions', icon: Play, label: 'Executions' },
  { href: '/integrations', icon: Plug, label: 'Integrations' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/notifications').then(({ data }) => {
      setNotifications(data.notifications || []);
      setUnread((data.notifications || []).filter(n => !n.isRead).length);
    }).catch(() => {});

    if (user) {
      connectSocket();
      subscribeUser(user._id || user.id);
      const socket = getSocket();
      socket.on('notification:new', (n) => {
        setNotifications(prev => [n, ...prev]);
        setUnread(c => c + 1);
      });
      return () => socket.off('notification:new');
    }
  }, [user]);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm">Agentflow AI</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>

        <nav className="p-4 space-y-1">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = router.pathname === href || router.pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-sky-500/20 text-sky-400 font-medium' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}>
                <Icon size={16} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm transition-colors w-full">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={18} />
              {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-sky-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">{unread > 9 ? '9+' : unread}</span>}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                  <span className="font-semibold text-sm">Notifications</span>
                  <button onClick={markAllRead} className="text-xs text-sky-400 hover:text-sky-300">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-6">No notifications</p>
                  ) : notifications.slice(0, 10).map((n, i) => (
                    <div key={i} className={`px-4 py-3 border-b border-slate-700/50 ${!n.isRead ? 'bg-sky-500/5' : ''}`}>
                      <div className="flex items-start gap-2">
                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'success' ? 'bg-emerald-400' : n.type === 'failure' ? 'bg-red-400' : 'bg-sky-400'}`} />
                        <div>
                          <p className="text-sm font-medium text-slate-200">{n.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
