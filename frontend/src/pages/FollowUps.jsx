import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PhoneCall, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

const DISPOSITIONS = ['Interested', 'Not Interested', 'Call Back Later', 'Not Reachable', 'Wrong Number', 'Converted', 'No Response', 'Other'];

const FILTERS = [
  { key: 'today', label: "Today's plan", params: { status: 'Planned', date: new Date().toISOString().slice(0, 10) } },
  { key: 'overdue', label: 'Overdue', params: { overdue: 'true' } },
  { key: 'planned', label: 'All planned', params: { status: 'Planned' } },
  { key: 'done', label: 'Done', params: { status: 'Done' } },
  { key: 'all', label: 'All', params: {} },
];

export default function FollowUps() {
  const [searchParams] = useSearchParams();
  const initial = searchParams.get('filter') || 'today';
  const [active, setActive] = useState(initial);
  const [list, setList] = useState([]);
  const [completing, setCompleting] = useState(null);
  const [form, setForm] = useState({ disposition: '', remark: '' });

  const load = (key) => {
    const f = FILTERS.find((x) => x.key === key) || FILTERS[0];
    api.listFollowups(f.params).then(setList);
  };
  useEffect(() => { load(active); }, [active]);

  const startComplete = (f) => {
    setCompleting(f.id);
    setForm({ disposition: f.disposition || '', remark: f.remark || '' });
  };

  const saveComplete = async (id) => {
    try {
      await api.updateFollowup(id, { status: 'Done', disposition: form.disposition, remark: form.remark });
      setCompleting(null);
      load(active);
    } catch (err) {
      alert('Could not save: ' + err.message);
    }
  };

  const isOverdue = (f) => f.status === 'Planned' && new Date(f.scheduled_at) < new Date();

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
        Follow-ups
      </h1>
      <p className="text-sm text-slate-500 mt-1">Every call planned or logged, across all inquiries.</p>

      <div className="flex gap-2 mt-6">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setActive(f.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              active === f.key ? 'bg-ink text-white border-ink' : 'border-line text-slate-500 hover:border-ink/40'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-line rounded-xl mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-canvas border-b border-line">
              <th className="py-3 px-4 font-medium">Inquiry</th>
              <th className="py-3 px-4 font-medium">Type</th>
              <th className="py-3 px-4 font-medium">When</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Disposition / Remark</th>
              <th className="py-3 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((f) => (
              completing === f.id ? (
                <tr key={f.id} className="border-b border-line/60 bg-canvas/40">
                  <td colSpan={6} className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-ink w-40 shrink-0">{f.inquiry_name}</span>
                      <select value={form.disposition} onChange={(e) => setForm({ ...form, disposition: e.target.value })}
                        className="border border-line rounded-lg px-2 py-1.5 text-xs">
                        <option value="">Disposition…</option>
                        {DISPOSITIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input placeholder="Remark" value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })}
                        className="border border-line rounded-lg px-2 py-1.5 text-xs flex-1" />
                      <button onClick={() => saveComplete(f.id)} className="text-xs font-medium text-good hover:underline">Save</button>
                      <button onClick={() => setCompleting(null)} className="text-xs text-slate-400 hover:underline">Cancel</button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={f.id} className="border-b border-line/60">
                  <td className="py-3 px-4">
                    <Link to={`/inquiries/${f.inquiry_id}`} className="text-ink font-medium hover:text-amber">{f.inquiry_name}</Link>
                    <div className="text-xs text-slate-400">{f.inquiry_phone}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 capitalize flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5" /> {f.type}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    {f.status === 'Planned' ? f.scheduled_at : (f.completed_at || f.sent_at)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={isOverdue(f) ? 'Missed' : f.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {f.disposition && <span className="font-medium text-ink">{f.disposition}</span>}
                    {f.remark && <div className="text-xs text-slate-400">{f.remark}</div>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {f.status === 'Planned' && (
                      <button onClick={() => startComplete(f)} className="text-xs text-ink hover:underline flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark done
                      </button>
                    )}
                  </td>
                </tr>
              )
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
