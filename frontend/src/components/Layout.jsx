import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/inquiries', label: 'Inquiries' },
  { to: '/institutions', label: 'Institutions' },
  { to: '/students', label: 'Students' },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'var(--font-body)' }}>
      <aside className="w-60 shrink-0 bg-ink text-white flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="font-display text-xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            CounselDesk
          </div>
          <div className="text-xs text-white/50 mt-1">Admission &amp; Revenue CRM</div>
        </div>
        <nav className="flex-1 py-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `block px-6 py-2.5 text-sm font-medium border-l-2 transition-colors ${
                  isActive
                    ? 'border-amber text-white bg-white/5'
                    : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 text-[11px] text-white/30 border-t border-white/10">
          Every inquiry, traced to revenue.
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
