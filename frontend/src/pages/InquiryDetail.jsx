import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

const LINK_STATUSES = ['Counseling', 'Applied', 'Offer', 'Rejected', 'Not Interested'];

export default function InquiryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInst, setSelectedInst] = useState('');
  const [waMessage, setWaMessage] = useState('');

  const load = () => {
    api.getInquiry(id).then(setInquiry);
    api.listInstitutions().then(setInstitutions);
  };
  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (inquiry) {
      setWaMessage(`Hi ${inquiry.name}, this is regarding your admission inquiry. Please let us know a good time to talk.`);
    }
  }, [inquiry?.name]);

  if (!inquiry) return <div className="p-8 text-slate-400">Loading…</div>;

  const linkInstitution = async () => {
    if (!selectedInst) return;
    await api.linkInstitution(id, { institution_id: Number(selectedInst) });
    setSelectedInst('');
    load();
  };

  const updateLinkStatus = async (linkId, status) => {
    await api.updateLink(linkId, { status });
    load();
  };

  const convert = async () => {
    await api.convertInquiry(id);
    load();
  };

  const sendWhatsApp = async () => {
    if (!inquiry.phone) return alert('No phone number on this inquiry.');
    const phone = inquiry.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`, '_blank');
    await api.addFollowup(id, { type: 'whatsapp', message: waMessage });
    load();
  };

  const logCall = async () => {
    await api.addFollowup(id, { type: 'call', message: 'Called student' });
    load();
  };

  return (
    <div className="p-8 max-w-4xl">
      <Link to="/inquiries" className="text-xs text-slate-400 hover:text-ink">&larr; Inquiries</Link>
      <div className="flex items-center justify-between mt-2">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            {inquiry.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{inquiry.phone} {inquiry.email && `· ${inquiry.email}`} {inquiry.course_interest && `· ${inquiry.course_interest}`}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={inquiry.status} />
          {inquiry.status !== 'Converted' && (
            <button onClick={convert} className="bg-amber text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90">
              Convert to student
            </button>
          )}
        </div>
      </div>

      {/* Institutions linked for counseling */}
      <h2 className="text-sm font-semibold text-ink mt-8 mb-3">Institutions in counseling</h2>
      <div className="bg-white border border-line rounded-xl p-4">
        <div className="flex gap-2 mb-4">
          <select value={selectedInst} onChange={(e) => setSelectedInst(e.target.value)}
            className="border border-line rounded-lg px-3 py-2 text-sm flex-1">
            <option value="">Select institution to add…</option>
            {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <button onClick={linkInstitution} className="bg-ink text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-ink-light">
            Add
          </button>
        </div>
        {inquiry.institutions.length === 0 ? (
          <p className="text-sm text-slate-400">Not linked to any institution yet.</p>
        ) : (
          <div className="divide-y divide-line">
            {inquiry.institutions.map((link) => (
              <div key={link.link_id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-ink">{link.name}</div>
                  <div className="text-xs text-slate-400">{link.type} · {link.city}</div>
                </div>
                <select value={link.counseling_status} onChange={(e) => updateLinkStatus(link.link_id, e.target.value)}
                  className="border border-line rounded-lg px-2 py-1 text-xs">
                  {LINK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Follow ups */}
      <h2 className="text-sm font-semibold text-ink mt-8 mb-3">Follow-ups</h2>
      <div className="bg-white border border-line rounded-xl p-4">
        <textarea value={waMessage} onChange={(e) => setWaMessage(e.target.value)}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm" rows={2} />
        <div className="flex gap-2 mt-3">
          <button onClick={sendWhatsApp} className="bg-good text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90">
            Send WhatsApp
          </button>
          <button onClick={logCall} className="border border-line text-sm font-medium px-4 py-2 rounded-lg text-ink hover:bg-canvas">
            Log a call
          </button>
        </div>
        <div className="mt-4 divide-y divide-line">
          {inquiry.followups.map((f) => (
            <div key={f.id} className="py-2 text-sm flex justify-between">
              <span className="text-ink">{f.type}: {f.message}</span>
              <span className="text-slate-400 text-xs">{f.sent_at}</span>
            </div>
          ))}
          {inquiry.followups.length === 0 && <p className="text-sm text-slate-400 py-2">No follow-ups logged yet.</p>}
        </div>
      </div>
    </div>
  );
}
