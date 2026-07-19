import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PhoneCall, CalendarClock, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import CustomFieldsPanel from '../components/CustomFieldsPanel';

const LINK_STATUSES = ['Counseling', 'Applied', 'Offer', 'Rejected', 'Not Interested'];
const DISPOSITIONS = ['Interested', 'Not Interested', 'Call Back Later', 'Not Reachable', 'Wrong Number', 'Converted', 'No Response', 'Other'];

export default function InquiryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInst, setSelectedInst] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [callTab, setCallTab] = useState('log'); // 'log' | 'schedule'
  const [callForm, setCallForm] = useState({ disposition: '', remark: '', scheduled_at: '' });
  const [completingId, setCompletingId] = useState(null);
  const [completeForm, setCompleteForm] = useState({ disposition: '', remark: '' });
  const [leadSources, setLeadSources] = useState([]);
  const [priorities, setPriorities] = useState([]);

  useEffect(() => {
    api.listOptions('lead_source').then(setLeadSources);
    api.listOptions('priority').then(setPriorities);
  }, []);

  const load = () => {
    api.getInquiry(id).then((inq) => { setInquiry(inq); setForm(inq); });
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
    try {
      await api.linkInstitution(id, { institution_id: Number(selectedInst) });
      setSelectedInst('');
      load();
    } catch (err) {
      alert('Could not link institution: ' + err.message);
    }
  };

  const updateLinkStatus = async (linkId, status) => {
    try {
      await api.updateLink(linkId, { status });
      load();
    } catch (err) {
      alert('Could not update status: ' + err.message);
    }
  };

  const convert = async () => {
    try {
      await api.convertInquiry(id);
      load();
    } catch (err) {
      alert('Could not convert: ' + err.message);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updateInquiry(id, form);
      setEditing(false);
      load();
    } catch (err) {
      alert('Could not save: ' + err.message);
    }
  };

  const sendWhatsApp = async () => {
    if (!inquiry.phone) return alert('No phone number on this inquiry.');
    const phone = inquiry.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`, '_blank');
    await api.addFollowup(id, { type: 'whatsapp', message: waMessage, status: 'Done' });
    load();
  };

  const logCall = async () => {
    try {
      await api.addFollowup(id, {
        type: 'call', status: 'Done',
        disposition: callForm.disposition, remark: callForm.remark,
      });
      setCallForm({ disposition: '', remark: '', scheduled_at: '' });
      load();
    } catch (err) {
      alert('Could not log call: ' + err.message);
    }
  };

  const scheduleCall = async () => {
    if (!callForm.scheduled_at) return alert('Pick a date and time first.');
    try {
      await api.addFollowup(id, {
        type: 'call', status: 'Planned',
        scheduled_at: callForm.scheduled_at, remark: callForm.remark,
      });
      setCallForm({ disposition: '', remark: '', scheduled_at: '' });
      load();
    } catch (err) {
      alert('Could not schedule: ' + err.message);
    }
  };

  const startCompleteFollowup = (f) => {
    setCompletingId(f.id);
    setCompleteForm({ disposition: f.disposition || '', remark: f.remark || '' });
  };

  const saveCompleteFollowup = async (fid) => {
    try {
      await api.updateFollowup(fid, { status: 'Done', disposition: completeForm.disposition, remark: completeForm.remark });
      setCompletingId(null);
      load();
    } catch (err) {
      alert('Could not save: ' + err.message);
    }
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
          {inquiry.priority && <StatusBadge status={inquiry.priority} />}
          <button onClick={() => { setForm(inquiry); setEditing((s) => !s); }}
            className="border border-line text-sm font-medium px-4 py-2 rounded-lg text-ink hover:bg-canvas">
            {editing ? 'Cancel' : 'Edit'}
          </button>
          {inquiry.status !== 'Converted' && (
            <button onClick={convert} className="bg-amber text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90">
              Convert to student
            </button>
          )}
        </div>
      </div>

      {editing && (
        <form onSubmit={saveEdit} className="bg-white border border-line rounded-xl p-5 mt-5 grid grid-cols-2 gap-4">
          <input required placeholder="Name" className="border border-line rounded-lg px-3 py-2 text-sm col-span-2"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Phone" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Email" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Course interest" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.course_interest || ''} onChange={(e) => setForm({ ...form, course_interest: e.target.value })} />
          <select className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.source || ''} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            <option value="">Source…</option>
            {leadSources.filter((s) => s.active).map((s) => <option key={s.id} value={s.label}>{s.label}</option>)}
          </select>
          <input placeholder="Counselor" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.counselor || ''} onChange={(e) => setForm({ ...form, counselor: e.target.value })} />
          <select className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.priority || ''} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="">Priority…</option>
            {priorities.filter((p) => p.active).map((p) => <option key={p.id} value={p.label}>{p.label}</option>)}
          </select>
          <select className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>New</option><option>In Counseling</option><option>Converted</option><option>Dropped</option>
          </select>
          <button type="submit" className="col-span-2 bg-amber text-white text-sm font-medium py-2 rounded-lg hover:opacity-90">
            Save changes
          </button>
        </form>
      )}

      {/* Custom fields */}
      <h2 className="text-sm font-semibold text-ink mt-8 mb-3">Custom fields</h2>
      <CustomFieldsPanel entityType="inquiry" recordId={inquiry.id} />

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
        {/* WhatsApp quick send */}
        <div className="mb-4 pb-4 border-b border-line">
          <label className="text-xs text-slate-500 font-medium block mb-1">WhatsApp message</label>
          <textarea value={waMessage} onChange={(e) => setWaMessage(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm" rows={2} />
          <button onClick={sendWhatsApp} className="mt-2 bg-good text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90">
            Send WhatsApp
          </button>
        </div>

        {/* Log or schedule a call */}
        <div className="flex gap-2 mb-3">
          <button onClick={() => setCallTab('log')}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border flex items-center gap-1 ${
              callTab === 'log' ? 'bg-ink text-white border-ink' : 'border-line text-slate-500'
            }`}>
            <PhoneCall className="w-3.5 h-3.5" /> Log a call
          </button>
          <button onClick={() => setCallTab('schedule')}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border flex items-center gap-1 ${
              callTab === 'schedule' ? 'bg-ink text-white border-ink' : 'border-line text-slate-500'
            }`}>
            <CalendarClock className="w-3.5 h-3.5" /> Schedule for later
          </button>
        </div>

        {callTab === 'log' ? (
          <div className="grid grid-cols-2 gap-2">
            <select value={callForm.disposition} onChange={(e) => setCallForm({ ...callForm, disposition: e.target.value })}
              className="border border-line rounded-lg px-3 py-2 text-sm">
              <option value="">Disposition…</option>
              {DISPOSITIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <input placeholder="Remark" value={callForm.remark} onChange={(e) => setCallForm({ ...callForm, remark: e.target.value })}
              className="border border-line rounded-lg px-3 py-2 text-sm" />
            <button onClick={logCall} className="col-span-2 border border-line text-sm font-medium px-4 py-2 rounded-lg text-ink hover:bg-canvas">
              Save call log
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <input type="datetime-local" value={callForm.scheduled_at} onChange={(e) => setCallForm({ ...callForm, scheduled_at: e.target.value })}
              className="border border-line rounded-lg px-3 py-2 text-sm col-span-2" />
            <input placeholder="Remark (what to discuss)" value={callForm.remark} onChange={(e) => setCallForm({ ...callForm, remark: e.target.value })}
              className="border border-line rounded-lg px-3 py-2 text-sm col-span-2" />
            <button onClick={scheduleCall} className="col-span-2 bg-amber text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90">
              Schedule follow-up
            </button>
          </div>
        )}

        {/* History */}
        <div className="mt-4 pt-4 border-t border-line divide-y divide-line">
          {inquiry.followups.map((f) => (
            completingId === f.id ? (
              <div key={f.id} className="py-2.5 bg-canvas/40 -mx-4 px-4">
                <div className="flex items-center gap-2">
                  <select value={completeForm.disposition} onChange={(e) => setCompleteForm({ ...completeForm, disposition: e.target.value })}
                    className="border border-line rounded-lg px-2 py-1.5 text-xs">
                    <option value="">Disposition…</option>
                    {DISPOSITIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input placeholder="Remark" value={completeForm.remark} onChange={(e) => setCompleteForm({ ...completeForm, remark: e.target.value })}
                    className="border border-line rounded-lg px-2 py-1.5 text-xs flex-1" />
                  <button onClick={() => saveCompleteFollowup(f.id)} className="text-xs font-medium text-good hover:underline">Save</button>
                  <button onClick={() => setCompletingId(null)} className="text-xs text-slate-400 hover:underline">Cancel</button>
                </div>
              </div>
            ) : (
              <div key={f.id} className="py-2.5 text-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-ink flex items-center gap-2">
                    <span className="capitalize font-medium">{f.type}</span>
                    <StatusBadge status={f.status === 'Planned' && new Date(f.scheduled_at) < new Date() ? 'Missed' : f.status} />
                    {f.disposition && <span className="text-xs text-slate-500">{f.disposition}</span>}
                  </div>
                  {(f.remark || f.message) && <div className="text-xs text-slate-400 mt-0.5">{f.remark || f.message}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-slate-400 text-xs">
                    {f.status === 'Planned' ? f.scheduled_at : (f.completed_at || f.sent_at)}
                  </div>
                  {f.status === 'Planned' && (
                    <button onClick={() => startCompleteFollowup(f)} className="text-xs text-ink hover:underline flex items-center gap-1 mt-1 ml-auto">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark done
                    </button>
                  )}
                </div>
              </div>
            )
          ))}
          {inquiry.followups.length === 0 && <p className="text-sm text-slate-400 py-2">No follow-ups logged yet.</p>}
        </div>
      </div>
    </div>
  );
}
