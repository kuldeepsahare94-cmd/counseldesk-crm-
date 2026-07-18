import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import CustomFieldsPanel from '../components/CustomFieldsPanel';

export default function InstitutionDetail() {
  const { id } = useParams();
  const [inst, setInst] = useState(null);
  const [counselings, setCounselings] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const load = () => {
    api.getInstitution(id).then((i) => { setInst(i); setForm(i); });
    api.institutionCounselings(id).then(setCounselings);
  };
  useEffect(() => { load(); }, [id]);

  if (!inst) return <div className="p-8 text-slate-400">Loading…</div>;

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updateInstitution(id, { ...form, commission_value: Number(form.commission_value) || 0 });
      setEditing(false);
      load();
    } catch (err) {
      alert('Could not save: ' + err.message);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <Link to="/institutions" className="text-xs text-slate-400 hover:text-ink">&larr; Institutions</Link>
      <div className="flex items-center justify-between mt-2">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            {inst.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {inst.type} · {inst.city || 'City not set'} ·{' '}
            {inst.commission_type === 'flat' ? `₹${inst.commission_value} flat` : `${inst.commission_value}% commission`}
          </p>
        </div>
        <button onClick={() => { setForm(inst); setEditing((s) => !s); }}
          className="bg-ink text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-ink-light">
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {editing && (
        <form onSubmit={saveEdit} className="bg-white border border-line rounded-xl p-5 mt-5 grid grid-cols-2 gap-4">
          <input required placeholder="Name" className="border border-line rounded-lg px-3 py-2 text-sm col-span-2"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.type || ''} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option>School</option><option>College</option><option>University</option>
          </select>
          <input placeholder="City" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input placeholder="Contact person" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.contact_person || ''} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
          <input placeholder="Contact phone" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.contact_phone || ''} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
          <select className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.commission_type} onChange={(e) => setForm({ ...form, commission_type: e.target.value })}>
            <option value="percentage">Commission %</option>
            <option value="flat">Flat commission ₹</option>
          </select>
          <input placeholder="Commission value" type="number" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.commission_value} onChange={(e) => setForm({ ...form, commission_value: e.target.value })} />
          <button type="submit" className="col-span-2 bg-amber text-white text-sm font-medium py-2 rounded-lg hover:opacity-90">
            Save changes
          </button>
        </form>
      )}

      <h2 className="text-sm font-semibold text-ink mt-8 mb-3">Custom fields</h2>
      <CustomFieldsPanel entityType="institution" recordId={inst.id} />

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
