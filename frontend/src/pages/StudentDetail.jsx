import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../api';
import { usePermissions } from '../context/usePermissions';
import StatusBadge from '../components/StatusBadge';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const can = usePermissions();
  const [student, setStudent] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const load = () => api.getStudent(id).then((s) => { setStudent(s); setForm(s); });
  useEffect(() => { load(); }, [id]);

  if (!student) return <div className="p-8 text-slate-400">Loading…</div>;

  const save = async (e) => {
    e.preventDefault();
    await api.updateStudent(id, form);
    setEditing(false);
    load();
  };

  return (
    <div className="p-8 max-w-5xl">
      <button onClick={() => navigate('/students')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>{student.student_name}</h1>
          <div className="mt-1"><StatusBadge status={student.status} /></div>
        </div>
        {can('students', 'edit') && (
          <button onClick={() => setEditing((s) => !s)} className="border border-line text-sm font-medium px-4 py-2 rounded-lg hover:bg-white">
            {editing ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} className="bg-white border border-line rounded-xl p-5 mt-6 grid grid-cols-2 gap-4 max-w-3xl">
          <input placeholder="Name" className="border border-line rounded-lg px-3 py-2 text-sm col-span-2" value={form.student_name || ''} onChange={(e) => setForm({ ...form, student_name: e.target.value })} />
          <input placeholder="Mobile" className="border border-line rounded-lg px-3 py-2 text-sm" value={form.mobile || ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          <input placeholder="Alternate mobile" className="border border-line rounded-lg px-3 py-2 text-sm" value={form.alternate_mobile || ''} onChange={(e) => setForm({ ...form, alternate_mobile: e.target.value })} />
          <input placeholder="Email" className="border border-line rounded-lg px-3 py-2 text-sm" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Aadhaar number" className="border border-line rounded-lg px-3 py-2 text-sm" value={form.aadhaar_number || ''} onChange={(e) => setForm({ ...form, aadhaar_number: e.target.value })} />
          <input placeholder="Parent name" className="border border-line rounded-lg px-3 py-2 text-sm" value={form.parent_name || ''} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} />
          <input placeholder="Parent mobile" className="border border-line rounded-lg px-3 py-2 text-sm" value={form.parent_mobile || ''} onChange={(e) => setForm({ ...form, parent_mobile: e.target.value })} />
          <input placeholder="Emergency contact" className="border border-line rounded-lg px-3 py-2 text-sm" value={form.emergency_contact || ''} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
          <select className="border border-line rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>Active</option><option>Inactive</option>
          </select>
          <button type="submit" className="col-span-2 bg-amber text-white text-sm font-medium py-2 rounded-lg hover:opacity-90">Save changes</button>
        </form>
      ) : (
        <div className="bg-white border border-line rounded-xl p-5 mt-6 max-w-3xl">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">Mobile</dt><dd className="text-ink">{student.mobile || '—'}</dd></div>
            <div><dt className="text-slate-500">Email</dt><dd className="text-ink">{student.email || '—'}</dd></div>
            <div><dt className="text-slate-500">Aadhaar</dt><dd className="text-ink">{student.aadhaar_number || '—'}</dd></div>
            <div><dt className="text-slate-500">Parent</dt><dd className="text-ink">{student.parent_name || '—'} {student.parent_mobile ? `(${student.parent_mobile})` : ''}</dd></div>
            <div><dt className="text-slate-500">Emergency contact</dt><dd className="text-ink">{student.emergency_contact || '—'}</dd></div>
            <div><dt className="text-slate-500">Qualification</dt><dd className="text-ink">{student.qualification || '—'}</dd></div>
          </dl>
          {student.lead_history && (
            <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-line">
              Originally a lead from <span className="text-slate-600">{student.lead_history.source || 'unknown source'}</span>, converted from lead #{student.lead_history.id}.
            </p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Admissions</h2>
          <div className="space-y-3">
            {student.admissions.map((a) => (
              <Link key={a.id} to={`/admissions/${a.id}`} className="block hover:bg-canvas -mx-2 px-2 py-1.5 rounded">
                <div className="text-sm text-ink font-medium">{a.course_name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusBadge status={a.admission_status} />
                  <span className="text-xs text-slate-400">{a.admission_number}</span>
                </div>
              </Link>
            ))}
            {student.admissions.length === 0 && <p className="text-sm text-slate-400">No admissions yet.</p>}
          </div>
        </div>

        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Payments</h2>
          <div className="space-y-3">
            {student.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-ink font-medium">{inr(p.amount)}</div>
                  <div className="text-xs text-slate-400">Installment #{p.installment_number}</div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
            {student.payments.length === 0 && <p className="text-sm text-slate-400">No payments yet.</p>}
          </div>
        </div>

        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Placements</h2>
          <div className="space-y-3">
            {student.placements.map((p) => (
              <div key={p.id}>
                <div className="text-sm text-ink font-medium">{p.company_name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusBadge status={p.interview_status} />
                  {p.result && <StatusBadge status={p.result} />}
                </div>
              </div>
            ))}
            {student.placements.length === 0 && <p className="text-sm text-slate-400">No placement activity yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
