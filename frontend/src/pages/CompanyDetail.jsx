import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);

  useEffect(() => { api.getCompany(id).then(setCompany); }, [id]);
  if (!company) return <div className="p-8 text-slate-400">Loading…</div>;

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => navigate('/companies')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Companies
      </button>

      <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>{company.company_name}</h1>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Details</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-slate-500">Industry</dt><dd className="text-ink">{company.industry || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Website</dt><dd className="text-ink">{company.website || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">HR Name</dt><dd className="text-ink">{company.hr_name || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">HR Mobile</dt><dd className="text-ink">{company.hr_mobile || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="text-ink">{company.email || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Contact Person</dt><dd className="text-ink">{company.contact_person || '—'}</dd></div>
          </dl>
          {company.notes && <p className="text-sm text-slate-500 mt-3 border-t border-line pt-3">{company.notes}</p>}
        </div>

        <div className="bg-white border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Placement History</h2>
          <div className="space-y-3">
            {company.placements.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-ink font-medium">{p.student_name}</div>
                  <div className="text-xs text-slate-400">{p.interview_date?.slice(0, 10) || '—'} {p.interview_round ? `· ${p.interview_round}` : ''}</div>
                </div>
                <div className="flex gap-1">
                  <StatusBadge status={p.interview_status} />
                  {p.result && <StatusBadge status={p.result} />}
                </div>
              </div>
            ))}
            {company.placements.length === 0 && <p className="text-sm text-slate-400">No interviews scheduled yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
