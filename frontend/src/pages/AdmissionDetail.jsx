import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../api';
import { usePermissions } from '../context/usePermissions';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['Active', 'Hold', 'Completed', 'Cancelled', 'Dropped'];
const STAGES = ['New', 'Documents Pending', 'Fees Pending', 'Admitted', 'Ongoing', 'Completed'];
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function AdmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const can = usePermissions();
  const [admission, setAdmission] = useState(null);

  const load = () => api.getAdmission(id).then(setAdmission);
  useEffect(() => { load(); }, [id]);

  if (!admission) return <div className="p-8 text-slate-400">Loading…</div>;

  const paidCount = admission.payments.filter((p) => p.status === 'Paid').length;
  const canAddInstallment = admission.payments.length < admission.emi_count;

  const update = async (field, value) => { await api.updateAdmission(id, { [field]: value }); load(); };
  const addInstallment = async () => { await api.nextInstallment(id); load(); };

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => navigate('/admissions')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Admissions
      </button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>{admission.admission_number}</h1>
          <p className="text-sm text-slate-500 mt-1">
            <Link to={`/students/${admission.student_id}`} className="hover:text-amber">{admission.student_name}</Link> · {admission.course_name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={admission.admission_status} />
            <StatusBadge status={admission.admission_stage} />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Admission Details</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-slate-500">Course Tenure</dt><dd className="text-ink">{admission.course_tenure}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Total Fees</dt><dd className="text-ink">{inr(admission.total_course_fees)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">EMI Count</dt><dd className="text-ink">{admission.emi_count}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Batch</dt><dd className="text-ink">{admission.batch || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Counselor</dt><dd className="text-ink">{admission.counselor || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Admission Date</dt><dd className="text-ink">{admission.admission_date?.slice(0, 10)}</dd></div>
          </dl>

          {can('admissions', 'edit') && (
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-line">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Status</label>
                <select value={admission.admission_status} onChange={(e) => update('admission_status', e.target.value)} className="border border-line rounded-lg px-3 py-2 text-sm w-full">
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Stage</label>
                <select value={admission.admission_stage} onChange={(e) => update('admission_stage', e.target.value)} className="border border-line rounded-lg px-3 py-2 text-sm w-full">
                  {STAGES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink">Payments ({paidCount}/{admission.emi_count} paid)</h2>
            {can('admissions', 'edit') && canAddInstallment && (
              <button onClick={addInstallment} className="text-xs text-amber hover:underline">+ Next installment</button>
            )}
          </div>
          <div className="space-y-3">
            {admission.payments.map((p) => (
              <Link key={p.id} to={`/payments/${p.id}`} className="flex items-center justify-between hover:bg-canvas -mx-2 px-2 py-1.5 rounded">
                <div>
                  <div className="text-sm text-ink font-medium">Installment #{p.installment_number} — {inr(p.amount)}</div>
                  <div className="text-xs text-slate-400">{p.payment_number}</div>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
            {admission.payments.length === 0 && <p className="text-sm text-slate-400">No payments yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
