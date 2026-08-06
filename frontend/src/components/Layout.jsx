import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users as UsersIcon, Building2, GraduationCap, Settings as SettingsIcon, LogOut, UserCog, PhoneCall, BarChart3, Palette, Database, FileText, CheckSquare, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

const links = [
  { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/inquiries', label: 'Inquiries', icon: UsersIcon },
  { to: '/followups', label: 'Follow-ups', icon: PhoneCall },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/institutions', label: 'Institutions', icon: Building2 },
  { to: '/students', label: 'Students', icon: GraduationCap },
  { to: '/applications', label: 'Applications', icon: FileText },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/master-data', label: 'Master Data', icon: Database },
  { to: '/settings', label: 'Custom Fields', icon: SettingsIcon },
  { to: '/appearance', label: 'Appearance', icon: Palette },
  { to: '/users', label: 'Users', icon: UserCog },
];

// The 4 most-used items get a dedicated mobile bottom-nav slot; everything
// else (including these 4) is always reachable via the drawer.
const BOTTOM_NAV = [
  { to: '/', label: 'Home', end: true, icon: LayoutDashboard },
  { to: '/inquiries', label: 'Inquiries', icon: UsersIcon },
  { to: '/followups', label: 'Calls', icon: PhoneCall },
  { to: '/students', label: 'Students', icon: GraduationCap },
];

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (user?.full_name || user?.username || '?').slice(0, 1).toUpperCase();

  return (
    <>
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

      <nav className="flex-1 py-4 overflow-y-auto">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-2.5 text-sm font-medium border-l-2 transition-colors ${
                  isActive ? 'border-amber text-white bg-white/[0.06]' : 'border-transparent text-white/55 hover:text-white hover:bg-white/[0.04]'
                }`
              }>
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
    </>
  );
}

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 bg-ink text-white flex-col fixed inset-y-0">
          <SidebarContent />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 bg-ink text-white flex flex-col">
              <button onClick={() => setDrawerOpen(false)} className="absolute top-5 right-4 text-white/60"><X className="w-5 h-5" /></button>
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex-1 min-w-0 md:ml-64">
          {/* Topbar */}
          <div className="sticky top-0 z-30 bg-white border-b border-line px-4 md:px-8 py-3 flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)} className="md:hidden text-ink shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            <GlobalSearch />
            <NotificationBell />
          </div>

          <main className="bg-canvas min-h-[calc(100vh-57px)] pb-16 md:pb-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-line flex">
        {BOTTOM_NAV.map((l) => {
          const Icon = l.icon;
          return (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                  isActive ? 'text-amber' : 'text-slate-400'
                }`
              }>
              <Icon className="w-5 h-5" />
              {l.label}
            </NavLink>
          );
        })}
        <button onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-slate-400">
          <Menu className="w-5 h-5" />
          More
        </button>
      </nav>
    </div>
  );
}
