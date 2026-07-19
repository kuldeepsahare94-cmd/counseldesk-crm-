import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckSquare, Plus, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

const FILTERS = [
  { key: 'today', label: 'Due today', params: { date: new Date().toISOString().slice(0, 10) } },
  { key: 'overdue', label: 'Overdue', params: { overdue: 'true' } },
  { key: 'todo', label: 'To Do', params: { status: 'To Do' } },
  { key: 'inprogress', label: 'In Progress', params: { status: 'In Progress' } },
  { key: 'done', label: 'Done', params: { status: 'Done' } },
  { key: 'all', label: 'All', params: {} },
];

const empty = { title: '', description: '', assigned_to: '', priority: '', due_date: '' };

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const [active, setActive] = useState(searchParams.get('filter') || 'all');
  const [list, setList] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);

  const load = (key) => {
    const f = FILTERS.find((x) => x.key === key) || FILTERS[0];
    api.listTasks(f.params).then(setList);
  };
  useEffect(() => { load(active); }, [active]);
  useEffect(() => { api.listOptions('priority').then(setPriorities); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.createTask(form);
      setForm(empty);
      setShowForm(false);
      load(active);
    } catch (err) { alert(err.message); }
  };

  const updateStatus = async (t, status) => {
    await api.updateTask(t.id, { status });
    load(active);
  };

  const isOverdue = (t) => t.status !== 'Done' && t.due_date && new Date(t.due_date) < new Date();

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-soft text-amber flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              Tasks
            </h1>
            <p className="text-sm text-slate-500 mt-1">Everything on your team's to-do list.</p>
          </div>
        </div>
        <button onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 bg-ink text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-ink-light">
          <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'New task'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-line rounded-xl p-5 mt-5 grid grid-cols-2 gap-4">
          <input required placeholder="Task title" className="border border-line rounded-lg px-3 py-2 text-sm col-span-2"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Description" className="border border-line rounded-lg px-3 py-2 text-sm col-span-2"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input placeholder="Assigned to" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} />
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="border border-line rounded-lg px-3 py-2 text-sm">
            <option value="">Priority…</option>
            {priorities.filter((p) => p.active).map((p) => <option key={p.id} value={p.label}>{p.label}</option>)}
          </select>
          <input type="datetime-local" className="border border-line rounded-lg px-3 py-2 text-sm col-span-2"
            value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <button type="submit" className="col-span-2 bg-amber text-white text-sm font-medium py-2 rounded-lg hover:opacity-90">
            Save task
          </button>
        </form>
      )}

      <div className="flex gap-2 mt-6 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setActive(f.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              active === f.key ? 'bg-ink text-white border-ink' : 'border-line text-slate-500 hover:border-ink/40'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-line rounded-xl mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-canvas border-b border-line">
              <th className="py-3 px-4 font-medium">Task</th>
              <th className="py-3 px-4 font-medium">Assigned to</th>
              <th className="py-3 px-4 font-medium">Priority</th>
              <th className="py-3 px-4 font-medium">Due</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id} className="border-b border-line/60">
                <td className="py-3 px-4">
                  <div className="text-ink font-medium">{t.title}</div>
                  {t.description && <div className="text-xs text-slate-400">{t.description}</div>}
                </td>
                <td className="py-3 px-4 text-slate-500">{t.assigned_to || '—'}</td>
                <td className="py-3 px-4">{t.priority && <StatusBadge status={t.priority} />}</td>
                <td className="py-3 px-4">
                  {isOverdue(t) && <StatusBadge status="Missed" />}
                  <span className="text-xs text-slate-400 ml-1">{t.due_date || 'No due date'}</span>
                </td>
                <td className="py-3 px-4">
                  <select value={t.status} onChange={(e) => updateStatus(t, e.target.value)}
                    className="border border-line rounded-lg px-2 py-1 text-xs">
                    <option>To Do</option><option>In Progress</option><option>Done</option>
                  </select>
                </td>
                <td className="py-3 px-4 text-right">
                  {t.status !== 'Done' && (
                    <button onClick={() => updateStatus(t, 'Done')} className="text-xs text-good hover:underline flex items-center gap-1 ml-auto">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Nothing here.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
