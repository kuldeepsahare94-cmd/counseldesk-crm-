import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, GraduationCap, Building2, Wallet, PhoneCall, CalendarCheck, AlertTriangle } from 'lucide-react';
import { api } from '../api';

function Card({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="bg-white border border-line rounded-xl p-5 hover:border-ink/20 hover:shadow-sm transition-all">
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
}

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [byInstitution, setByInstitution] = useState([]);
  const [counseling, setCounseling] = useState([]);
  const [trend, setTrend] = useState([]);
  const [funnel, setFunnel] = useState(null);
  const [followupsSummary, setFollowupsSummary] = useState(null);

  useEffect(() => {
    api.summary().then(setSummary);
    api.revenueByInstitution().then(setByInstitution);
    api.institutionCounselingReport().then(setCounseling);
    api.trend().then(setTrend);
    api.funnel().then(setFunnel);
    api.followupsSummary().then(setFollowupsSummary);
  }, []);

  if (!summary) return <div className="p-8 text-slate-400">Loading…</div>;

  const chartData = byInstitution
    .filter((r) => r.total_commission > 0)
    .slice(0, 8)
    .map((r) => ({ id: r.id, name: r.name, commission: r.total_commission }));

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
        Dashboard
      </h1>
      <p className="text-sm text-slate-500 mt-1">Overview of inquiries, counseling, and revenue.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Link to="/inquiries"><Card label="Total Inquiries" value={summary.total_inquiries} icon={Users} accent="bg-sky-50 text-sky-600" /></Link>
        <Link to="/students"><Card label="Students Converted" value={summary.total_students} icon={GraduationCap} accent="bg-emerald-50 text-good" /></Link>
        <Link to="/students"><Card label="Active Enrollments" value={summary.total_enrollments} icon={Building2} accent="bg-amber-soft text-amber" /></Link>
        <Card label="Revenue Earned" value={inr(summary.revenue_total)} sub={`${inr(summary.revenue_pending)} pending`} icon={Wallet} accent="bg-ink/5 text-ink" />
      </div>

      {funnel && (
        <div className="flex flex-wrap gap-2 mt-4">
          {funnel.inquiry_stages.map((s) => (
            <Link key={s.status} to={`/inquiries?status=${encodeURIComponent(s.status)}`}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-line text-slate-600 hover:border-ink/40 hover:text-ink bg-white">
              {s.status}: {s.c}
            </Link>
          ))}
        </div>
      )}

      {followupsSummary && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-ink mb-3">Follow-ups</h2>
          <div className="grid grid-cols-3 gap-4">
            <Link to="/followups?filter=today">
              <Card label="Planned Today" value={followupsSummary.planned_today} icon={CalendarCheck} accent="bg-sky-50 text-sky-600" />
            </Link>
            <Link to="/followups?filter=done">
              <Card label="Done Today" value={followupsSummary.done_today} icon={PhoneCall} accent="bg-emerald-50 text-good" />
            </Link>
            <Link to="/followups?filter=overdue">
              <Card label="Overdue" value={followupsSummary.overdue} icon={AlertTriangle} accent="bg-red-50 text-warn" />
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white border border-line rounded-xl p-5 mt-6">
        <h2 className="text-sm font-semibold text-ink mb-1">Inquiry trend (last 6 months)</h2>
        <p className="text-xs text-slate-400 mb-3">Click a point to see that month's inquiries.</p>
        {trend.length === 0 ? (
          <p className="text-sm text-slate-400">Not enough data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend} onClick={(e) => e && e.activeLabel && navigate(`/inquiries?month=${e.activeLabel}`)}
              style={{ cursor: 'pointer' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E0D8" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="inquiries" stroke="#14213D" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-1">Commission by institution</h2>
          <p className="text-xs text-slate-400 mb-3">Click a bar to open that institution.</p>
          {chartData.length === 0 ? (
            <p className="text-sm text-slate-400">No revenue recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E0D8" />
                <XAxis type="number" tickFormatter={(v) => `₹${v / 1000}k`} fontSize={12} />
                <YAxis type="category" dataKey="name" width={110} fontSize={12} />
                <Tooltip formatter={(v) => inr(v)} />
                <Bar dataKey="commission" fill="#E3A008" radius={[0, 4, 4, 0]} cursor="pointer"
                  onClick={(data) => navigate(`/institutions/${data.id}`)} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-4">Counseling volume by institution</h2>
          {counseling.length === 0 ? (
            <p className="text-sm text-slate-400">No institutions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-line">
                  <th className="py-2 font-medium">Institution</th>
                  <th className="py-2 font-medium text-right">Counseled</th>
                  <th className="py-2 font-medium text-right">Offers</th>
                </tr>
              </thead>
              <tbody>
                {counseling.slice(0, 8).map((row) => (
                  <tr key={row.id} className="border-b border-line/60 hover:bg-canvas/60">
                    <td className="py-2">
                      <Link to={`/institutions/${row.id}`} className="text-ink hover:text-amber">{row.name}</Link>
                    </td>
                    <td className="py-2 text-right">{row.counseling_count}</td>
                    <td className="py-2 text-right text-good">{row.offers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
