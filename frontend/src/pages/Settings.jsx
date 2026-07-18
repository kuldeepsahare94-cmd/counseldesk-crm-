import { useEffect, useState } from 'react';
import { api } from '../api';

const ENTITIES = [
  { key: 'inquiry', label: 'Inquiries' },
  { key: 'institution', label: 'Institutions' },
  { key: 'student', label: 'Students' },
  { key: 'enrollment', label: 'Enrollments' },
];

const empty = { label: '', field_type: 'text', optionsText: '' };

export default function Settings() {
  const [entity, setEntity] = useState('inquiry');
  const [fields, setFields] = useState([]);
  const [form, setForm] = useState(empty);

  const load = () => api.listCustomFields(entity).then(setFields);
  useEffect(() => { load(); }, [entity]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const options = form.field_type === 'dropdown'
        ? form.optionsText.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;
      await api.createCustomField({ entity_type: entity, label: form.label, field_type: form.field_type, options });
      setForm(empty);
      load();
    } catch (err) {
      alert('Could not add field: ' + err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this field? Any saved values for it will be lost.')) return;
    await api.deleteCustomField(id);
    load();
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
        Settings — Custom Fields
      </h1>
      <p className="text-sm text-slate-500 mt-1">
        Add your own fields and dropdowns to Inquiries, Institutions, Students, or Enrollments — no code needed.
      </p>

      <div className="flex gap-2 mt-6">
        {ENTITIES.map((e) => (
          <button key={e.key} onClick={() => setEntity(e.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              entity === e.key ? 'bg-ink text-white border-ink' : 'border-line text-slate-500 hover:border-ink/40'
            }`}>
            {e.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="bg-white border border-line rounded-xl p-5 mt-5 grid grid-cols-2 gap-4">
        <input required placeholder="Field label (e.g. Parent phone)" className="border border-line rounded-lg px-3 py-2 text-sm col-span-2"
          value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <select className="border border-line rounded-lg px-3 py-2 text-sm"
          value={form.field_type} onChange={(e) => setForm({ ...form, field_type: e.target.value })}>
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="date">Date</option>
          <option value="dropdown">Dropdown</option>
        </select>
        {form.field_type === 'dropdown' && (
          <input placeholder="Options, comma separated (e.g. Hot, Warm, Cold)" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.optionsText} onChange={(e) => setForm({ ...form, optionsText: e.target.value })} />
        )}
        <button type="submit" className="col-span-2 bg-amber text-white text-sm font-medium py-2 rounded-lg hover:opacity-90">
          Add field to {ENTITIES.find((e) => e.key === entity).label}
        </button>
      </form>

      <div className="bg-white border border-line rounded-xl mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-canvas border-b border-line">
              <th className="py-3 px-4 font-medium">Field</th>
              <th className="py-3 px-4 font-medium">Type</th>
              <th className="py-3 px-4 font-medium">Options</th>
              <th className="py-3 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.id} className="border-b border-line/60">
                <td className="py-3 px-4 text-ink font-medium">{f.label}</td>
                <td className="py-3 px-4 text-slate-500 capitalize">{f.field_type}</td>
                <td className="py-3 px-4 text-slate-500">{f.options ? JSON.parse(f.options).join(', ') : '—'}</td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => remove(f.id)} className="text-xs text-warn hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {fields.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-slate-400">No custom fields yet for this section.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
