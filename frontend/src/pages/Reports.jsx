import { useEffect, useState } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import { downloadCSV } from '../utils/csv';

const TABS = [
  { key: 'inquiries', label: 'Inquiries' },
  { key: 'institutions', label: 'Institutions' },
  { key: 'students', label: 'Students' },
  { key: 'enrollments', label: 'Revenue / Enrollments' },
  { key: 'followups', label: 'Follow-ups' },
];

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function Reports() {
  const [tab, setTab] = useState('inquiries');
  const [inquiries, setInquiries] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    api.listInquiries().then(setInquiries);
    api.revenueByInstitution().then(setInstitutions);
    api.listStudents().then(setStudents);
    api.listEnrollments().then(setEnrollments);
    api.listFollowups({}).then(setFollowups);
  }, []);

  const filteredInquiries = statusFilter === 'All' ? inquiries : inquiries.filter((i) => i.status === statusFilter);

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-soft text-amber flex items-center justify-center">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">Every module, exportable, in one place.</p>
        </div>
      </div>

      <div className="flex gap-2 mt-6 flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              tab === t.key ? 'bg-ink text-white border-ink' : 'border-line text-slate-500 hover:border-ink/40'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Inquiries */}
      {tab === 'inquiries' && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-line rounded-lg px-3 py-1.5 text-xs">
              {['All', 'New', 'In Counseling', 'Converted', 'Dropped'].map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => downloadCSV('inquiries.csv', filteredInquiries)}
              className="flex items-center gap-1.5 text-xs font-medium border border-line px-3 py-1.5 rounded-lg text-ink hover:bg-canvas">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="bg-white border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 bg-canvas border-b border-line">
                  <th className="py-2.5 px-4 font-medium">Name</th>
                  <th className="py-2.5 px-4 font-medium">Phone</th>
                  <th className="py-2.5 px-4 font-medium">Source</th>
                  <th className="py-2.5 px-4 font-medium">Counselor</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Institutions</th>
                  <th className="py-2.5 px-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.map((r) => (
                  <tr key={r.id} className="border-b border-line/60">
                    <td className="py-2.5 px-4 text-ink font-medium">{r.name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{r.phone}</td>
                    <td className="py-2.5 px-4 text-slate-500">{r.source || '—'}</td>
                    <td className="py-2.5 px-4 text-slate-500">{r.counselor || '—'}</td>
                    <td className="py-2.5 px-4"><StatusBadge status={r.status} /></td>
                    <td className="py-2.5 px-4 text-right">{r.institution_count}</td>
                    <td className="py-2.5 px-4 text-slate-400 text-xs">{r.created_at}</td>
                  </tr>
                ))}
                {filteredInquiries.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-400">No data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Institutions */}
      {tab === 'institutions' && (
        <div className="mt-6">
          <div className="flex justify-end mb-3">
            <button onClick={() => downloadCSV('institutions-revenue.csv', institutions)}
              className="flex items-center gap-1.5 text-xs font-medium border border-line px-3 py-1.5 rounded-lg text-ink hover:bg-canvas">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="bg-white border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 bg-canvas border-b border-line">
                  <th className="py-2.5 px-4 font-medium">Institution</th>
                  <th className="py-2.5 px-4 font-medium text-right">Enrollments</th>
                  <th className="py-2.5 px-4 font-medium text-right">Total Fees</th>
                  <th className="py-2.5 px-4 font-medium text-right">Commission</th>
                  <th className="py-2.5 px-4 font-medium text-right">Received</th>
                  <th className="py-2.5 px-4 font-medium text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((r) => (
                  <tr key={r.id} className="border-b border-line/60">
                    <td className="py-2.5 px-4 text-ink font-medium">{r.name}</td>
                    <td className="py-2.5 px-4 text-right">{r.enrollment_count}</td>
                    <td className="py-2.5 px-4 text-right">{inr(r.total_fees)}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-ink">{inr(r.total_commission)}</td>
                    <td className="py-2.5 px-4 text-right text-good">{inr(r.received)}</td>
                    <td className="py-2.5 px-4 text-right text-amber">{inr(r.pending)}</td>
                  </tr>
                ))}
                {institutions.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-400">No data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Students */}
      {tab === 'students' && (
        <div className="mt-6">
          <div className="flex justify-end mb-3">
            <button onClick={() => downloadCSV('students.csv', students)}
              className="flex items-center gap-1.5 text-xs font-medium border border-line px-3 py-1.5 rounded-lg text-ink hover:bg-canvas">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="bg-white border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 bg-canvas border-b border-line">
                  <th className="py-2.5 px-4 font-medium">Name</th>
                  <th className="py-2.5 px-4 font-medium">Phone</th>
                  <th className="py-2.5 px-4 font-medium text-right">Enrollments</th>
                  <th className="py-2.5 px-4 font-medium">Converted</th>
                </tr>
              </thead>
              <tbody>
                {students.map((r) => (
                  <tr key={r.id} className="border-b border-line/60">
                    <td className="py-2.5 px-4 text-ink font-medium">{r.name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{r.phone}</td>
                    <td className="py-2.5 px-4 text-right">{r.enrollment_count}</td>
                    <td className="py-2.5 px-4 text-slate-400 text-xs">{r.converted_at}</td>
                  </tr>
                ))}
                {students.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-400">No data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enrollments / Revenue */}
      {tab === 'enrollments' && (
        <div className="mt-6">
          <div className="flex justify-end mb-3">
            <button onClick={() => downloadCSV('enrollments.csv', enrollments)}
              className="flex items-center gap-1.5 text-xs font-medium border border-line px-3 py-1.5 rounded-lg text-ink hover:bg-canvas">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="bg-white border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 bg-canvas border-b border-line">
                  <th className="py-2.5 px-4 font-medium">Student</th>
                  <th className="py-2.5 px-4 font-medium">Institution</th>
                  <th className="py-2.5 px-4 font-medium">Course</th>
                  <th className="py-2.5 px-4 font-medium text-right">Fee</th>
                  <th className="py-2.5 px-4 font-medium text-right">Commission</th>
                  <th className="py-2.5 px-4 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((r) => (
                  <tr key={r.id} className="border-b border-line/60">
                    <td className="py-2.5 px-4 text-ink font-medium">{r.student_name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{r.institution_name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{r.course}</td>
                    <td className="py-2.5 px-4 text-right">{inr(r.fee_total)}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-ink">{inr(r.commission_amount)}</td>
                    <td className="py-2.5 px-4"><StatusBadge status={r.payment_status} /></td>
                  </tr>
                ))}
                {enrollments.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-400">No data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Follow-ups */}
      {tab === 'followups' && (
        <div className="mt-6">
          <div className="flex justify-end mb-3">
            <button onClick={() => downloadCSV('followups.csv', followups)}
              className="flex items-center gap-1.5 text-xs font-medium border border-line px-3 py-1.5 rounded-lg text-ink hover:bg-canvas">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="bg-white border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 bg-canvas border-b border-line">
                  <th className="py-2.5 px-4 font-medium">Inquiry</th>
                  <th className="py-2.5 px-4 font-medium">Type</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">Disposition</th>
                  <th className="py-2.5 px-4 font-medium">Remark</th>
                  <th className="py-2.5 px-4 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {followups.map((r) => (
                  <tr key={r.id} className="border-b border-line/60">
                    <td className="py-2.5 px-4 text-ink font-medium">{r.inquiry_name}</td>
                    <td className="py-2.5 px-4 text-slate-500 capitalize">{r.type}</td>
                    <td className="py-2.5 px-4"><StatusBadge status={r.status} /></td>
                    <td className="py-2.5 px-4 text-slate-500">{r.disposition || '—'}</td>
                    <td className="py-2.5 px-4 text-slate-500">{r.remark || '—'}</td>
                    <td className="py-2.5 px-4 text-slate-400 text-xs">{r.status === 'Planned' ? r.scheduled_at : (r.completed_at || r.sent_at)}</td>
                  </tr>
                ))}
                {followups.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-400">No data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
