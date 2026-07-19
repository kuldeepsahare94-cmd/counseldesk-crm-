import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const empty = { name: '', type: 'College', city: '', commission_type: 'percentage', commission_value: '', university_id: '' };

export default function Institutions() {
  const [list, setList] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => api.listInstitutions().then(setList);
  useEffect(() => { load(); api.listUniversities().then(setUniversities); }, []);

  const pickUniversity = (universityId) => {
    const uni = universities.find((u) => String(u.id) === String(universityId));
    setForm((f) => ({
      ...f,
      university_id: universityId,
      name: uni && !f.name ? uni.name : f.name,
      city: uni && !f.city ? (uni.city || '') : f.city,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.createInstitution({ ...form, commission_value: Number(form.commission_value) || 0, university_id: form.university_id || null });
      setForm(empty);
      setShowForm(false);
      load();
    } catch (err) {
      alert('Could not save: ' + err.message);
    }
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            Institutions
          </h1>
          <p className="text-sm text-slate-500 mt-1">Schools, colleges &amp; universities you place students into.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-ink text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-ink-light"
        >
          {showForm ? 'Cancel' : '+ Add institution'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-line rounded-xl p-5 mt-5 grid grid-cols-2 gap-4">
          <select className="border border-line rounded-lg px-3 py-2 text-sm col-span-2 bg-amber-soft"
            value={form.university_id} onChange={(e) => pickUniversity(e.target.value)}>
            <option value="">Link to a Master Data university (optional)…</option>
            {universities.map((u) => <option key={u.id} value={u.id}>{u.name}{u.city ? ` — ${u.city}` : ''}</option>)}
          </select>
          <input required placeholder="Name" className="border border-line rounded-lg px-3 py-2 text-sm col-span-2"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option>School</option><option>College</option><option>University</option>
          </select>
          <input placeholder="City" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <select className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.commission_type} onChange={(e) => setForm({ ...form, commission_type: e.target.value })}>
            <option value="percentage">Commission %</option>
            <option value="flat">Flat commission ₹</option>
          </select>
          <input placeholder={form.commission_type === 'flat' ? 'Amount ₹' : 'Percentage'} type="number"
            className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.commission_value} onChange={(e) => setForm({ ...form, commission_value: e.target.value })} />
          <button type="submit" className="col-span-2 bg-amber text-white text-sm font-medium py-2 rounded-lg hover:opacity-90">
            Save institution
          </button>
        </form>
      )}

      <div className="bg-white border border-line rounded-xl mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-canvas border-b border-line">
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Type</th>
              <th className="py-3 px-4 font-medium">City</th>
              <th className="py-3 px-4 font-medium">Commission</th>
              <th className="py-3 px-4 font-medium text-right">Counseled</th>
              <th className="py-3 px-4 font-medium text-right">Enrolled</th>
            </tr>
          </thead>
          <tbody>
            {list.map((inst) => (
              <tr key={inst.id} className="border-b border-line/60 hover:bg-canvas/60">
                <td className="py-3 px-4">
                  <Link to={`/institutions/${inst.id}`} className="text-ink font-medium hover:text-amber">{inst.name}</Link>
                  {inst.university_name && <div className="text-xs text-slate-400">↳ {inst.university_name}</div>}
                </td>
                <td className="py-3 px-4 text-slate-500">{inst.type}</td>
                <td className="py-3 px-4 text-slate-500">{inst.city}</td>
                <td className="py-3 px-4 text-slate-500">
                  {inst.commission_type === 'flat' ? `₹${inst.commission_value}` : `${inst.commission_value}%`}
                </td>
                <td className="py-3 px-4 text-right">{inst.counseling_count}</td>
                <td className="py-3 px-4 text-right">{inst.enrolled_count}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">No institutions yet. Add your first one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
