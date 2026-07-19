import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRightCircle } from 'lucide-react';
import { api } from '../api';

const empty = { student_id: '', institution_id: '', course_id: '', course: '', intake_id: '', notes: '' };

export default function Applications() {
  const [list, setList] = useState([]);
  const [students, setStudents] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [converting, setConverting] = useState(null);
  const [convertForm, setConvertForm] = useState({ fee_total: '', payment_status: 'Pending' });

  const load = () => api.listApplications(statusFilter === 'All' ? {} : { status: statusFilter }).then(setList);
  useEffect(() => { load(); }, [statusFilter]);
  useEffect(() => {
    api.listStudents().then(setStudents);
    api.listInstitutions().then(setInstitutions);
    api.listIntakes().then(setIntakes);
    api.listOptions('application_status').then(setStatuses);
  }, []);

  const pickInstitution = (institutionId) => {
    setForm((f) => ({ ...f, institution_id: institutionId, course_id: '', course: '' }));
    const inst = institutions.find((i) => String(i.id) === String(institutionId));
    if (inst && inst.university_id) api.listCourses(inst.university_id).then(setCatalogCourses);
    else setCatalogCourses([]);
  };

  const pickCourse = (courseId) => {
    const c = catalogCourses.find((x) => String(x.id) === String(courseId));
    setForm((f) => ({ ...f, course_id: courseId, course: c ? c.name : f.course }));
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.createApplication({ ...form, student_id: Number(form.student_id), institution_id: Number(form.institution_id) });
      setForm(empty);
      setCatalogCourses([]);
      setShowForm(false);
      load();
    } catch (err) {
      alert('Could not save: ' + err.message);
    }
  };

  const updateStatus = async (app, status) => {
    try {
      await api.updateApplication(app.id, { status });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const startConvert = (app) => {
    setConverting(app.id);
    setConvertForm({ fee_total: '', payment_status: 'Pending' });
  };

  const saveConvert = async (appId) => {
    try {
      await api.convertApplication(appId, { fee_total: Number(convertForm.fee_total) || 0, payment_status: convertForm.payment_status });
      setConverting(null);
      load();
      alert('Converted to an enrollment — check the Students page.');
    } catch (err) {
      alert('Could not convert: ' + err.message);
    }
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-soft text-amber flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              Applications
            </h1>
            <p className="text-sm text-slate-500 mt-1">Every application a student has submitted, tracked to a decision.</p>
          </div>
        </div>
        <button onClick={() => setShowForm((s) => !s)}
          className="bg-ink text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-ink-light">
          {showForm ? 'Cancel' : '+ New application'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-line rounded-xl p-5 mt-5 grid grid-cols-2 gap-4">
          <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}
            className="border border-line rounded-lg px-3 py-2 text-sm col-span-2">
            <option value="">Select student…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select required value={form.institution_id} onChange={(e) => pickInstitution(e.target.value)}
            className="border border-line rounded-lg px-3 py-2 text-sm col-span-2">
            <option value="">Select institution…</option>
            {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          {catalogCourses.length > 0 && (
            <select value={form.course_id} onChange={(e) => pickCourse(e.target.value)}
              className="border border-line rounded-lg px-3 py-2 text-sm col-span-2 bg-amber-soft">
              <option value="">Pick from course catalog (optional)…</option>
              {catalogCourses.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.level}</option>)}
            </select>
          )}
          <input placeholder="Course" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
          <select value={form.intake_id} onChange={(e) => setForm({ ...form, intake_id: e.target.value })}
            className="border border-line rounded-lg px-3 py-2 text-sm">
            <option value="">Intake (optional)…</option>
            {intakes.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
          <input placeholder="Notes" className="border border-line rounded-lg px-3 py-2 text-sm col-span-2"
            value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button type="submit" className="col-span-2 bg-amber text-white text-sm font-medium py-2 rounded-lg hover:opacity-90">
            Save application
          </button>
        </form>
      )}

      <div className="flex gap-2 mt-6 flex-wrap">
        {['All', ...statuses.map((s) => s.label)].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              statusFilter === s ? 'bg-ink text-white border-ink' : 'border-line text-slate-500 hover:border-ink/40'
            }`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white border border-line rounded-xl mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-canvas border-b border-line">
              <th className="py-3 px-4 font-medium">App #</th>
              <th className="py-3 px-4 font-medium">Student</th>
              <th className="py-3 px-4 font-medium">Institution</th>
              <th className="py-3 px-4 font-medium">Course</th>
              <th className="py-3 px-4 font-medium">Intake</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              converting === a.id ? (
                <tr key={a.id} className="border-b border-line/60 bg-canvas/40">
                  <td colSpan={7} className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-ink">Convert {a.application_number} to enrollment:</span>
                      <input type="number" placeholder="Total fee (₹)" value={convertForm.fee_total}
                        onChange={(e) => setConvertForm({ ...convertForm, fee_total: e.target.value })}
                        className="border border-line rounded-lg px-2 py-1.5 text-xs w-32" />
                      <select value={convertForm.payment_status} onChange={(e) => setConvertForm({ ...convertForm, payment_status: e.target.value })}
                        className="border border-line rounded-lg px-2 py-1.5 text-xs">
                        <option>Pending</option><option>Partial</option><option>Received</option>
                      </select>
                      <button onClick={() => saveConvert(a.id)} className="text-xs font-medium text-good hover:underline">Confirm</button>
                      <button onClick={() => setConverting(null)} className="text-xs text-slate-400 hover:underline">Cancel</button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={a.id} className="border-b border-line/60 hover:bg-canvas/60">
                  <td className="py-3 px-4 text-slate-400 text-xs font-mono">{a.application_number}</td>
                  <td className="py-3 px-4">
                    <Link to={`/students/${a.student_id}`} className="text-ink font-medium hover:text-amber">{a.student_name}</Link>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{a.institution_name}</td>
                  <td className="py-3 px-4 text-slate-500">{a.course_name || a.course || '—'}</td>
                  <td className="py-3 px-4 text-slate-500">{a.intake_label || '—'}</td>
                  <td className="py-3 px-4">
                    <select value={a.status} onChange={(e) => updateStatus(a, e.target.value)}
                      className="border border-line rounded-lg px-2 py-1 text-xs">
                      {statuses.map((s) => <option key={s.id} value={s.label}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {a.status === 'Accepted' && (
                      <button onClick={() => startConvert(a)} className="text-xs text-amber hover:underline flex items-center gap-1 ml-auto">
                        <ArrowRightCircle className="w-3.5 h-3.5" /> Convert
                      </button>
                    )}
                  </td>
                </tr>
              )
            ))}
            {list.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400">No applications yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
