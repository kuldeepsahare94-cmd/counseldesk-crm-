import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserCheck } from 'lucide-react';
import { api } from '../api';
import { usePermissions } from '../context/usePermissions';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['New', 'Contacted', 'Interested', 'Follow-up', 'Converted', 'Dropped', 'Not Interested'];

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const can = usePermissions();
  const [lead, setLead] = useState(null);
  const [note, setNote] = useState('');

  const load = () => api.getLead(id).then(setLead);
  useEffect(() => { load(); }, [id]);

  if (!lead) return <div className="p-8 text-slate-400">Loading…</div>;

  const changeStatus = async (status) => {
    await api.updateLead(id, { status });
    load();
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    await api.addLeadActivity(id, { type: 'note', note });
    setNote('');
    load();
  };

  const convert = async () => {
    if (!confirm(`Convert ${lead.student_name} to a Student record?`)) return;
    const res = await api.convertLead(id);
    navigate(`/students/${res.student_id}`);
  };

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => navigate('/leads')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Leads
      </button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>{lead.student_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={lead.status} />
            {lead.converted_student_id && (
              <Link to={`/students/${lead.converted_student_id}`} className="text-xs text-amber hover:underline">View student record →</Link>
            )}
          </div>
        </div>
        {can('leads', 'edit') && !lead.converted_student_id && (
          <button onClick={convert} className="flex items-center gap-1.5 bg-good text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90">
            <UserCheck className="w-4 h-4" /> Convert to Student
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Details</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-slate-500">Mobile</dt><dd className="text-ink">{lead.mobile || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Alternate mobile</dt><dd className="text-ink">{lead.alternate_mobile || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="text-ink">{lead.email || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Gender</dt><dd className="text-ink">{lead.gender || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">DOB</dt><dd className="text-ink">{lead.date_of_birth || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">City</dt><dd className="text-ink">{lead.city || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Qualification</dt><dd className="text-ink">{lead.qualification || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Source</dt><dd className="text-ink">{lead.source || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Interested course</dt><dd className="text-ink">{lead.interested_course_name || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Follow-up date</dt><dd className="text-ink">{lead.follow_up_date?.slice(0, 10) || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Counselor</dt><dd className="text-ink">{lead.assigned_counselor || '—'}</dd></div>
          </dl>
          {lead.remarks && <p className="text-sm text-slate-500 mt-3 border-t border-line pt-3">{lead.remarks}</p>}

          {can('leads', 'edit') && !lead.converted_student_id && (
            <div className="mt-4 pt-4 border-t border-line">
              <label className="text-xs font-medium text-slate-500 block mb-1">Change status</label>
              <select value={lead.status} onChange={(e) => changeStatus(e.target.value)} className="border border-line rounded-lg px-3 py-2 text-sm w-full">
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Activity</h2>
          {can('leads', 'edit') && (
            <form onSubmit={addNote} className="flex gap-2 mb-4">
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note or call log…"
                className="flex-1 border border-line rounded-lg px-3 py-2 text-sm" />
              <button type="submit" className="bg-ink text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-ink-light">Add</button>
            </form>
          )}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {lead.activities.map((a) => (
              <div key={a.id} className="text-sm border-l-2 border-line pl-3">
                <div className="text-ink">{a.note}</div>
                <div className="text-xs text-slate-400 mt-0.5">{a.type} · {a.created_at}</div>
              </div>
            ))}
            {lead.activities.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
