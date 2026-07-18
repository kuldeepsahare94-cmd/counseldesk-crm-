import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ institution_id: '', course: '', fee_total: '', payment_status: 'Pending' });

  const load = () => {
    api.getStudent(id).then(setStudent);
    api.listInstitutions().then(setInstitutions);
  };
  useEffect(() => { load(); }, [id]);

  if (!student) return <div className="p-8 text-slate-400">Loading…</div>;

  const submitEnrollment = async (e) => {
    e.preventDefault();
    await api.createEnrollment({
      student_id: Number(id),
      institution_id: Number(form.institution_id),
      course: form.course,
      fee_total: Number(form.fee_total) || 0,
      payment_status: form.payment_status,
    });
    setForm({ institution_id: '', course: '', fee_total: '', payment_status: 'Pending' });
    setShowForm(false);
    load();
  };

  const updatePayment = async (enrollmentId, payment_status) => {
    await api.updateEnrollment(enrollmentId, { payment_status });
    load();
  };

  return (
    <div className="p-8 max-w-4xl">
      <Link to="/students" className="text-xs text-slate-400 hover:text-ink">&larr; Students</Link>
      <h1 className="font-display text-2xl font-semibold text-ink mt-2" style={{ fontFamily: 'var(--font-display)' }}>
        {student.name}
      </h1>
      <p className="text-sm text-slate-500 mt-1">{student.phone} {student.email && `· ${student.email}`}</p>

      <h2 className="text-sm font-semibold text-ink mt-8 mb-3">Counseling history</h2>
      <div className="bg-white border border-line rounded-xl p-4">
        {student.counseling_history.length === 0 ? (
          <p className="text-sm text-slate-400">No counseling history recorded.</p>
        ) : (
          <div className="divide-y divide-line">
            {student.counseling_history.map((h, i) => (
              <div key={i} className="py-2 flex items-center justify-between text-sm">
                <span className="text-ink">{h.institution_name}</span>
                <StatusBadge status={h.counseling_status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="text-sm font-semibold text-ink">Enrollment &amp; revenue</h2>
        <button onClick={() => setShowForm((s) => !s)} className="bg-ink text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-ink-light">
          {showForm ? 'Cancel' : '+ Enroll into institution'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submitEnrollment} className="bg-white border border-line rounded-xl p-5 grid grid-cols-2 gap-4 mb-4">
          <select required value={form.institution_id} onChange={(e) => setForm({ ...form, institution_id: e.target.value })}
            className="border border-line rounded-lg px-3 py-2 text-sm col-span-2">
            <option value="">Select institution…</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.commission_type === 'flat' ? `₹${i.commission_value} flat` : `${i.commission_value}%`})
              </option>
            ))}
          </select>
          <input placeholder="Course" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
          <input placeholder="Total fee (₹)" type="number" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.fee_total} onChange={(e) => setForm({ ...form, fee_total: e.target.value })} />
          <select className="border border-line rounded-lg px-3 py-2 text-sm col-span-2"
            value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })}>
            <option>Pending</option><option>Partial</option><option>Received</option>
          </select>
          <button type="submit" className="col-span-2 bg-amber text-white text-sm font-medium py-2 rounded-lg hover:opacity-90">
            Save enrollment
          </button>
        </form>
      )}

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-canvas border-b border-line">
              <th className="py-3 px-4 font-medium">Institution</th>
              <th className="py-3 px-4 font-medium">Course</th>
              <th className="py-3 px-4 font-medium text-right">Fee</th>
              <th className="py-3 px-4 font-medium text-right">Our share</th>
              <th className="py-3 px-4 font-medium">Payment</th>
            </tr>
          </thead>
          <tbody>
            {student.enrollments.map((en) => (
              <tr key={en.id} className="border-b border-line/60">
                <td className="py-3 px-4 text-ink font-medium">{en.institution_name}</td>
                <td className="py-3 px-4 text-slate-500">{en.course}</td>
                <td className="py-3 px-4 text-right">{inr(en.fee_total)}</td>
                <td className="py-3 px-4 text-right font-medium text-ink">{inr(en.commission_amount)}</td>
                <td className="py-3 px-4">
                  <select value={en.payment_status} onChange={(e) => updatePayment(en.id, e.target.value)}
                    className="border border-line rounded-lg px-2 py-1 text-xs">
                    <option>Pending</option><option>Partial</option><option>Received</option>
                  </select>
                </td>
              </tr>
            ))}
            {student.enrollments.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">Not enrolled anywhere yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
