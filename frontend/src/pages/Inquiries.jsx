import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { List, LayoutGrid } from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

const empty = { name: '', phone: '', email: '', course_interest: '', source: '', counselor: '', priority: '' };
const STATUSES = ['All', 'New', 'In Counseling', 'Converted', 'Dropped'];
const KANBAN_COLUMNS = ['New', 'In Counseling', 'Converted', 'Dropped'];

export default function Inquiries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('status') || 'All';
  const monthFilter = searchParams.get('month') || '';
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState(initialFilter);
  const [view, setView] = useState('list'); // 'list' | 'kanban'
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [leadSources, setLeadSources] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [dragOverCol, setDragOverCol] = useState(null);

  const load = () => {
    const params = {};
    if (view === 'list' && filter !== 'All') params.status = filter;
    if (monthFilter) params.month = monthFilter;
    api.listInquiries(params).then(setList);
  };
  useEffect(() => { load(); }, [filter, monthFilter, view]);
  useEffect(() => {
    api.listOptions('lead_source').then(setLeadSources);
    api.listOptions('priority').then(setPriorities);
  }, []);

  const onDrop = async (e, status) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    try {
      await api.updateInquiry(id, { status });
      load();
    } catch (err) {
      alert('Could not move: ' + err.message);
    }
  };

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
        <div className="flex items-center gap-2">
          <div className="flex bg-canvas border border-line rounded-lg p-0.5">
            <button onClick={() => setView('list')} className={`p-1.5 rounded-md ${view === 'list' ? 'bg-white shadow-sm text-ink' : 'text-slate-400'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setView('kanban')} className={`p-1.5 rounded-md ${view === 'kanban' ? 'bg-white shadow-sm text-ink' : 'text-slate-400'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setShowForm((s) => !s)} className="bg-ink text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-ink-light">
            {showForm ? 'Cancel' : '+ New inquiry'}
          </button>
        </div>
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
          <select className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            <option value="">Source…</option>
            {leadSources.filter((s) => s.active).map((s) => <option key={s.id} value={s.label}>{s.label}</option>)}
          </select>
          <select className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="">Priority…</option>
            {priorities.filter((p) => p.active).map((p) => <option key={p.id} value={p.label}>{p.label}</option>)}
          </select>
          <input placeholder="Counselor assigned" className="border border-line rounded-lg px-3 py-2 text-sm col-span-2"
            value={form.counselor} onChange={(e) => setForm({ ...form, counselor: e.target.value })} />
          <button type="submit" className="col-span-2 bg-amber text-white text-sm font-medium py-2 rounded-lg hover:opacity-90">
            Save inquiry
          </button>
        </form>
      )}

      {view === 'list' && (
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
      )}

      {view === 'list' ? (
        <div className="bg-white border border-line rounded-xl mt-4 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 bg-canvas border-b border-line">
                <th className="py-3 px-4 font-medium">Name</th>
                <th className="py-3 px-4 font-medium">Phone</th>
                <th className="py-3 px-4 font-medium">Course</th>
                <th className="py-3 px-4 font-medium">Priority</th>
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
                  <td className="py-3 px-4">{inq.priority && <StatusBadge status={inq.priority} />}</td>
                  <td className="py-3 px-4"><StatusBadge status={inq.status} /></td>
                  <td className="py-3 px-4 text-right">{inq.institution_count}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">No inquiries here yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map((col) => (
            <div key={col}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => onDrop(e, col)}
              className={`rounded-xl p-2 min-h-[300px] transition-colors ${dragOverCol === col ? 'bg-amber-soft' : 'bg-canvas'}`}>
              <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{col}</span>
                <span className="text-xs text-slate-400">{list.filter((i) => i.status === col).length}</span>
              </div>
              <div className="space-y-2">
                {list.filter((i) => i.status === col).map((inq) => (
                  <div key={inq.id} draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', String(inq.id))}
                    className="bg-white border border-line rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-sm">
                    <Link to={`/inquiries/${inq.id}`} className="text-sm font-medium text-ink hover:text-amber block truncate">{inq.name}</Link>
                    <div className="text-xs text-slate-400 mt-0.5">{inq.phone}</div>
                    {inq.priority && <div className="mt-1.5"><StatusBadge status={inq.priority} /></div>}
                  </div>
                ))}
                {list.filter((i) => i.status === col).length === 0 && (
                  <p className="text-xs text-slate-300 text-center py-4">Drop here</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
