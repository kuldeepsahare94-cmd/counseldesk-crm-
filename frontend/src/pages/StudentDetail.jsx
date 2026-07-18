import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import CustomFieldsPanel from '../components/CustomFieldsPanel';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ institution_id: '', course: '', fee_total: '', payment_status: 'Pending' });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [enrollForm, setEnrollForm] = useState(null);

  const load = () => {
    api.getStudent(id).then((s) => { setStudent(s); setEditForm(s); });
    api.listInstitutions().then(setInstitutions);
  };
  useEffect(() => { load(); }, [id]);

  if (!student) return <div className="p-8 text-slate-400">Loading…</div>;

  const submitEnrollment = async (e) => {
    e.preventDefault();
    try {
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
    } catch (err) {
      alert('Could not save: ' + err.message);
    }
  };

  const updatePayment = async (enrollmentId, payment_status) => {
    await api.updateEnrollment(enrollmentId, { payment_status });
    load();
  };

  const saveStudentEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updateStudent(id, editForm);
      setEditing(false);
      load();
    } catch (err) {
      alert('Could not save: ' + err.message);
    }
  };

  const startEditEnrollment = (en) => {
    setEditingEnrollment(en.id);
    setEnrollForm({ course: en.course || '', fee_total: en.fee_total, commission_type: en.commission_type,
      commission_value: en.commission_value, payment_status: en.payment_status, status: en.status });
  };

  const saveEnrollmentEdit = async (enrollmentId) => {
    try {
      await api.updateEnrollment(enrollmentId, {
        ...enrollForm,
        fee_total: Number(enrollForm.fee_total) || 0,
        commission_value: Number(enrollForm.commission_value) || 0,
      });
      setEditingEnrollment(null);
      load();
    } catch (err) {
      alert('Could not save: ' + err.message);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <Link to="/students" className="text-xs text-slate-400 hover:text-ink">&larr; Students</Link>
      <div className="flex items-center justify-between mt-2">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            {student.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{student.phone} {student.email && `· ${student.email}`}</p>
        </div>
        <button onClick={() => { setEditForm(student); setEditing((s) => !s); }}
          className="bg-ink text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-ink-light">
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {editing && (
        <form onSubmit={saveStudentEdit} className="bg-white border border-line rounded-xl p-5 mt-4 grid grid-cols-2 gap-4">
          <input required placeholder="Name" className="border border-line rounded-lg px-3 py-2 text-sm col-span-2"
            value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <input placeholder="Phone" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <input placeholder="Email" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <button type="submit" className="col-span-2 bg-amber text-white text-sm font-medium py-2 rounded-lg hover:opacity-90">
            Save changes
          </button>
        </form>
      )}

      <h2 className="text-sm font-semibold text-ink mt-8 mb-3">Custom fields</h2>
      <CustomFieldsPanel entityType="student" recordId={student.id} />

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
              <th className="py-3 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {student.enrollments.map((en) => (
              editingEnrollment === en.id ? (
                <tr key={en.id} className="border-b border-line/60 bg-canvas/40">
                  <td className="py-2 px-4 text-ink font-medium">{en.institution_name}</td>
                  <td className="py-2 px-4">
                    <input className="border border-line rounded-lg px-2 py-1 text-xs w-full"
                      value={enrollForm.course} onChange={(e) => setEnrollForm({ ...enrollForm, course: e.target.value })} />
                  </td>
                  <td className="py-2 px-4">
                    <input type="number" className="border border-line rounded-lg px-2 py-1 text-xs w-full text-right"
                      value={enrollForm.fee_total} onChange={(e) => setEnrollForm({ ...enrollForm, fee_total: e.target.value })} />
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex gap-1">
                      <select className="border border-line rounded-lg px-1 py-1 text-xs"
                        value={enrollForm.commission_type} onChange={(e) => setEnrollForm({ ...enrollForm, commission_type: e.target.value })}>
                        <option value="percentage">%</option><option value="flat">₹</option>
                      </select>
                      <input type="number" className="border border-line rounded-lg px-2 py-1 text-xs w-16"
                        value={enrollForm.commission_value} onChange={(e) => setEnrollForm({ ...enrollForm, commission_value: e.target.value })} />
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <select value={enrollForm.payment_status} onChange={(e) => setEnrollForm({ ...enrollForm, payment_status: e.target.value })}
                      className="border border-line rounded-lg px-2 py-1 text-xs">
                      <option>Pending</option><option>Partial</option><option>Received</option>
                    </select>
                  </td>
                  <td className="py-2 px-4 whitespace-nowrap">
                    <button onClick={() => saveEnrollmentEdit(en.id)} className="text-xs text-good font-medium hover:underline mr-2">Save</button>
                    <button onClick={() => setEditingEnrollment(null)} className="text-xs text-slate-400 hover:underline">Cancel</button>
                  </td>
                </tr>
              ) : (
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
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => startEditEnrollment(en)} className="text-xs text-ink hover:underline">Edit</button>
                  </td>
                </tr>
              )
            ))}
            {student.enrollments.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Not enrolled anywhere yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
