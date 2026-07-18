import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users as UsersIcon, Building2, GraduationCap, Settings as SettingsIcon, LogOut, UserCog, PhoneCall, BarChart3, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/inquiries', label: 'Inquiries', icon: UsersIcon },
  { to: '/followups', label: 'Follow-ups', icon: PhoneCall },
  { to: '/institutions', label: 'Institutions', icon: Building2 },
  { to: '/students', label: 'Students', icon: GraduationCap },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Custom Fields', icon: SettingsIcon },
  { to: '/appearance', label: 'Appearance', icon: Palette },
  { to: '/users', label: 'Users', icon: UserCog },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.full_name || user?.username || '?').slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'var(--font-body)' }}>
      <aside className="w-64 shrink-0 bg-ink text-white flex flex-col">
        <div className="px-6 py-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold tracking-tight leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              CounselDesk
            </div>
            <div className="text-[11px] text-white/40">Admission &amp; Revenue CRM</div>
          </div>
        </div>

        <nav className="flex-1 py-4">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-2.5 text-sm font-medium border-l-2 transition-colors ${
                    isActive
                      ? 'border-amber text-white bg-white/[0.06]'
                      : 'border-transparent text-white/55 hover:text-white hover:bg-white/[0.04]'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {l.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-amber/20 text-amber flex items-center justify-center text-sm font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">{user?.full_name || user?.username}</div>
              <div className="text-[11px] text-white/40 truncate">@{user?.username}</div>
            </div>
            <button onClick={handleLogout} title="Log out" className="text-white/40 hover:text-white shrink-0">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 bg-canvas">
        <Outlet />
      </main>
    </div>
  );
}
