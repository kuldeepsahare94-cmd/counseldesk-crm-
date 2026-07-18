import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../api';

function Card({ label, value, sub }) {
  return (
    <div className="bg-white border border-line rounded-xl p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</div>
      <div className="font-display text-3xl font-semibold text-ink mt-2" style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [byInstitution, setByInstitution] = useState([]);
  const [counseling, setCounseling] = useState([]);

  useEffect(() => {
    api.summary().then(setSummary);
    api.revenueByInstitution().then(setByInstitution);
    api.institutionCounselingReport().then(setCounseling);
  }, []);

  if (!summary) return <div className="p-8 text-slate-400">Loading…</div>;

  const chartData = byInstitution
    .filter((r) => r.total_commission > 0)
    .slice(0, 8)
    .map((r) => ({ name: r.name, commission: r.total_commission }));

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
        Dashboard
      </h1>
      <p className="text-sm text-slate-500 mt-1">Overview of inquiries, counseling, and revenue.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card label="Total Inquiries" value={summary.total_inquiries} />
        <Card label="Students Converted" value={summary.total_students} />
        <Card label="Active Enrollments" value={summary.total_enrollments} />
        <Card label="Revenue Earned" value={inr(summary.revenue_total)} sub={`${inr(summary.revenue_pending)} pending`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-4">Commission by institution</h2>
          {chartData.length === 0 ? (
            <p className="text-sm text-slate-400">No revenue recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E0D8" />
                <XAxis type="number" tickFormatter={(v) => `₹${v / 1000}k`} fontSize={12} />
                <YAxis type="category" dataKey="name" width={110} fontSize={12} />
                <Tooltip formatter={(v) => inr(v)} />
                <Bar dataKey="commission" fill="#E3A008" radius={[0, 4, 4, 0]} />
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
                  <tr key={row.id} className="border-b border-line/60">
                    <td className="py-2 text-ink">{row.name}</td>
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
