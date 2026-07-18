import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function InstitutionDetail() {
  const { id } = useParams();
  const [inst, setInst] = useState(null);
  const [counselings, setCounselings] = useState([]);

  const load = () => {
    api.getInstitution(id).then(setInst);
    api.institutionCounselings(id).then(setCounselings);
  };
  useEffect(() => { load(); }, [id]);

  if (!inst) return <div className="p-8 text-slate-400">Loading…</div>;

  return (
    <div className="p-8 max-w-4xl">
      <Link to="/institutions" className="text-xs text-slate-400 hover:text-ink">&larr; Institutions</Link>
      <h1 className="font-display text-2xl font-semibold text-ink mt-2" style={{ fontFamily: 'var(--font-display)' }}>
        {inst.name}
      </h1>
      <p className="text-sm text-slate-500 mt-1">
        {inst.type} · {inst.city || 'City not set'} ·{' '}
        {inst.commission_type === 'flat' ? `₹${inst.commission_value} flat` : `${inst.commission_value}% commission`}
      </p>

      <h2 className="text-sm font-semibold text-ink mt-8 mb-3">Counseling history</h2>
      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-canvas border-b border-line">
              <th className="py-3 px-4 font-medium">Student / Inquiry</th>
              <th className="py-3 px-4 font-medium">Phone</th>
              <th className="py-3 px-4 font-medium">Counseling status</th>
              <th className="py-3 px-4 font-medium">Since</th>
            </tr>
          </thead>
          <tbody>
            {counselings.map((c) => (
              <tr key={c.link_id} className="border-b border-line/60">
                <td className="py-3 px-4">
                  <Link to={`/inquiries/${c.inquiry_id}`} className="text-ink font-medium hover:text-amber">{c.name}</Link>
                </td>
                <td className="py-3 px-4 text-slate-500">{c.phone}</td>
                <td className="py-3 px-4"><StatusBadge status={c.counseling_status} /></td>
                <td className="py-3 px-4 text-slate-400 text-xs">{c.created_at}</td>
              </tr>
            ))}
            {counselings.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-slate-400">No counseling records linked yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
