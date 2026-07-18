import { useEffect, useState } from 'react';
import { UserPlus, Shield, ShieldOff, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const empty = { username: '', password: '', full_name: '' };

export default function Users() {
  const { user: me } = useAuth();
  const [list, setList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => api.listUsers().then(setList);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(form);
      setForm(empty);
      setShowForm(false);
      load();
    } catch (err) {
      alert('Could not add user: ' + err.message);
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.updateUser(u.id, { active: !u.active });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const remove = async (u) => {
    if (!confirm(`Delete user "${u.username}"? This can't be undone.`)) return;
    try {
      await api.deleteUser(u.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            Users
          </h1>
          <p className="text-sm text-slate-500 mt-1">Who can log in to CounselDesk, and who's blocked.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-ink-light">
          <UserPlus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Add user'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-line rounded-xl p-5 mt-5 grid grid-cols-2 gap-4">
          <input required placeholder="Username" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input required type="password" placeholder="Password (min 6 chars)" className="border border-line rounded-lg px-3 py-2 text-sm"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input placeholder="Full name" className="border border-line rounded-lg px-3 py-2 text-sm col-span-2"
            value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <button type="submit" className="col-span-2 bg-amber text-white text-sm font-medium py-2 rounded-lg hover:opacity-90">
            Create user
          </button>
        </form>
      )}

      <div className="bg-white border border-line rounded-xl mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-canvas border-b border-line">
              <th className="py-3 px-4 font-medium">Username</th>
              <th className="py-3 px-4 font-medium">Full name</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-b border-line/60">
                <td className="py-3 px-4 text-ink font-medium">
                  {u.username} {me?.id === u.id && <span className="text-xs text-slate-400">(you)</span>}
                </td>
                <td className="py-3 px-4 text-slate-500">{u.full_name || '—'}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.active ? 'bg-emerald-100 text-good' : 'bg-red-50 text-warn'
                  }`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => toggleActive(u)} disabled={me?.id === u.id}
                      title={u.active ? 'Deactivate' : 'Activate'}
                      className="text-slate-400 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed">
                      {u.active ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </button>
                    <button onClick={() => remove(u)} disabled={me?.id === u.id}
                      title="Delete" className="text-slate-400 hover:text-warn disabled:opacity-30 disabled:cursor-not-allowed">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-slate-400">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
