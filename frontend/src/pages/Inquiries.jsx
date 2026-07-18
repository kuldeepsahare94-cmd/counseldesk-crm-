import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

const empty = { name: '', phone: '', email: '', course_interest: '', source: '', counselor: '' };
const STATUSES = ['All', 'New', 'In Counseling', 'Converted', 'Dropped'];

export default function Inquiries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('status') || 'All';
  const monthFilter = searchParams.get('month') || '';
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState(initialFilter);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => {
    const params = {};
    if (filter !== 'All') params.status = filter;
    if (monthFilter) params.month = monthFilter;
    api.listInquiries(params).then(setList);
  };
  useEffect(() => { load(); }, [filter, monthFilter]);

  const changeFilter = (s) => {
    setFilter(s);
    const next = {};
    if (s !== 'All') next.status = s;
    if (monthFilter) next.month = monthFilter;
    setSearchParams(next);
  };

  const clearMonth = () => {
    const next = {};
    if (filter !== 'All') next.status = filter;
    setSearchParams(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.createInquiry(form);
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
            Inquiries
          </h1>
          <p className="text-sm text-slate-500 mt-1">Every prospect who's walked in or called.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="bg-ink text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-ink-light">
          {showForm ? 'Cancel' : '+ New inquiry'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-line rounded-xl p-5 mt-5 grid grid-cols-2 gap-4">
          <input required placeholder="Student name" className="border border-line rounded-lg px-3 py-2 text-sm col-span-2"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Phone" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Email" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Course interest" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.course_interest} onChange={(e) => setForm({ ...form, course_interest: e.target.value })} />
          <input placeholder="Source (walk-in / referral / FB...)" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <input placeholder="Counselor assigned" className="border border-line rounded-lg px-3 py-2 text-sm col-span-2"
            value={form.counselor} onChange={(e) => setForm({ ...form, counselor: e.target.value })} />
          <button type="submit" className="col-span-2 bg-amber text-white text-sm font-medium py-2 rounded-lg hover:opacity-90">
            Save inquiry
          </button>
        </form>
      )}

      <div className="flex gap-2 mt-6 items-center">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => changeFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              filter === s ? 'bg-ink text-white border-ink' : 'border-line text-slate-500 hover:border-ink/40'
            }`}>
            {s}
          </button>
        ))}
        {monthFilter && (
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-soft text-amber flex items-center gap-2">
            Month: {monthFilter}
            <button onClick={clearMonth} className="hover:opacity-70">✕</button>
          </span>
        )}
      </div>

      <div className="bg-white border border-line rounded-xl mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-canvas border-b border-line">
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Phone</th>
              <th className="py-3 px-4 font-medium">Course</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Institutions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((inq) => (
              <tr key={inq.id} className="border-b border-line/60 hover:bg-canvas/60">
                <td className="py-3 px-4">
                  <Link to={`/inquiries/${inq.id}`} className="text-ink font-medium hover:text-amber">{inq.name}</Link>
                </td>
                <td className="py-3 px-4 text-slate-500">{inq.phone}</td>
                <td className="py-3 px-4 text-slate-500">{inq.course_interest}</td>
                <td className="py-3 px-4"><StatusBadge status={inq.status} /></td>
                <td className="py-3 px-4 text-right">{inq.institution_count}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">No inquiries here yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
