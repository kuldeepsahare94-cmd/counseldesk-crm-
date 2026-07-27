import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, GraduationCap, ClipboardList, Wallet, Briefcase, Building2, TrendingUp, CalendarClock } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

function Card({ label, value, sub, icon: Icon, accent, to }) {
  const body = (
    <div className="bg-white border border-line rounded-xl p-5 hover:border-ink/20 hover:shadow-sm transition-all h-full">
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</div>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent || 'bg-slate-100 text-slate-500'}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="font-display text-3xl font-semibold text-ink mt-2" style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => { api.dashboard().then(setData); }, []);

  if (!data) return <div className="p-8 text-slate-400">Loading…</div>;
  const c = data.cards;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="p-8 max-w-6xl">
      <div className="rounded-2xl p-6 mb-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-ink), var(--color-ink-light))' }}>
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative">
          <p className="text-white/50 text-xs">{today}</p>
          <h1 className="font-display text-2xl font-semibold mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            {greeting}, {user?.full_name?.split(' ')[0] || user?.username || 'there'}
          </h1>
          <p className="text-white/60 text-sm mt-1">Here's where things stand today.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="Total Leads" value={c.total_leads} sub={`${c.todays_leads} today · ${c.monthly_leads} this month`} icon={Users} accent="bg-sky-50 text-sky-600" to="/leads" />
        <Card label="Active Students" value={c.active_students} sub={`${c.total_students} total`} icon={GraduationCap} accent="bg-emerald-50 text-good" to="/students" />
        <Card label="Pending Admissions" value={c.pending_admissions} sub={`${c.new_admissions} today · ${c.monthly_admissions} this month`} icon={ClipboardList} accent="bg-amber-soft text-amber" to="/admissions" />
        <Card label="Total Revenue" value={inr(c.total_revenue)} sub={`${inr(c.pending_fees)} pending · ${c.due_payments} due`} icon={Wallet} accent="bg-ink/5 text-ink" to="/payments" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <Card label="Today's Collection" value={inr(c.todays_collection)} icon={TrendingUp} accent="bg-emerald-50 text-good" to="/payments" />
        <Card label="Monthly Collection" value={inr(c.monthly_collection)} icon={TrendingUp} accent="bg-emerald-50 text-good" to="/payments" />
        <Card label="Companies" value={c.total_companies} icon={Building2} accent="bg-sky-50 text-sky-600" to="/companies" />
        <Card label="Students Selected" value={c.students_selected} sub={`${c.interviews_scheduled} scheduled · ${c.placement_pending} pending`} icon={Briefcase} accent="bg-emerald-50 text-good" to="/placements" />
      </div>

      {data.admissions_by_status.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {data.admissions_by_status.map((s) => (
            <Link key={s.status} to={`/admissions?status=${encodeURIComponent(s.status)}`}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-line text-slate-600 hover:border-ink/40 hover:text-ink bg-white">
              {s.status}: {s.c}
            </Link>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-1">Admission Trends</h2>
          <p className="text-xs text-slate-400 mb-4">Last 6 months</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.admission_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="c" name="Admissions" fill="var(--color-amber)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-1">Monthly Revenue</h2>
          <p className="text-xs text-slate-400 mb-4">Collected payments, last 6 months</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.monthly_revenue_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => inr(v)} />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-ink)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Top Courses (by admissions)</h2>
          <div className="space-y-2">
            {data.top_courses.map((tc) => (
              <div key={tc.course_name} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{tc.course_name}</span>
                <span className="font-medium text-ink">{tc.admissions}</span>
              </div>
            ))}
            {data.top_courses.length === 0 && <p className="text-sm text-slate-400">No admissions yet.</p>}
          </div>
        </div>

        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Course-wise Revenue</h2>
          <div className="space-y-2">
            {data.course_wise_revenue.map((cw) => (
              <div key={cw.course_name} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{cw.course_name}</span>
                <span className="font-medium text-ink">{inr(cw.revenue)}</span>
              </div>
            ))}
            {data.course_wise_revenue.length === 0 && <p className="text-sm text-slate-400">No revenue yet.</p>}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Recent Admissions</h2>
          <div className="space-y-3">
            {data.recent_admissions.map((a) => (
              <Link key={a.id} to={`/admissions/${a.id}`} className="block text-sm hover:bg-canvas -mx-2 px-2 py-1 rounded">
                <div className="text-ink font-medium">{a.student_name}</div>
                <div className="text-xs text-slate-400">{a.course_name} · {a.admission_number}</div>
              </Link>
            ))}
            {data.recent_admissions.length === 0 && <p className="text-sm text-slate-400">Nothing yet.</p>}
          </div>
        </div>

        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Recent Payments</h2>
          <div className="space-y-3">
            {data.recent_payments.map((p) => (
              <Link key={p.id} to={`/payments/${p.id}`} className="flex items-center justify-between text-sm hover:bg-canvas -mx-2 px-2 py-1 rounded">
                <div>
                  <div className="text-ink font-medium">{p.student_name}</div>
                  <div className="text-xs text-slate-400">{inr(p.amount)}</div>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
            {data.recent_payments.length === 0 && <p className="text-sm text-slate-400">Nothing yet.</p>}
          </div>
        </div>

        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4" /> Upcoming Interviews
          </h2>
          <div className="space-y-3">
            {data.upcoming_interviews.map((i) => (
              <Link key={i.id} to={`/placements`} className="block text-sm hover:bg-canvas -mx-2 px-2 py-1 rounded">
                <div className="text-ink font-medium">{i.student_name} → {i.company_name}</div>
                <div className="text-xs text-slate-400">{i.interview_date?.slice(0, 10)} {i.interview_round ? `· ${i.interview_round}` : ''}</div>
              </Link>
            ))}
            {data.upcoming_interviews.length === 0 && <p className="text-sm text-slate-400">Nothing scheduled.</p>}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-4">
        Placement success rate: <span className="font-medium text-ink">{data.placement_success_rate}%</span>
      </p>
    </div>
  );
}
