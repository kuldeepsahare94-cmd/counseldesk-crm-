import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.login(username, password);
      login(token, user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }} />
      <div className="relative w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber mb-4">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            CounselDesk
          </h1>
          <p className="text-white/50 text-sm mt-1">Admission &amp; Revenue CRM</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl p-7 shadow-2xl">
          <label className="text-xs font-medium text-slate-500 block mb-1">Username</label>
          <input required autoFocus value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber" />

          <label className="text-xs font-medium text-slate-500 block mb-1">Password</label>
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber" />

          {error && <p className="text-warn text-xs mt-2 mb-2">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-ink text-white text-sm font-medium py-2.5 rounded-lg mt-4 hover:bg-ink-light transition-colors disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs mt-6">
          First time? Default login is admin / admin123 — change it right after in Settings → Users.
        </p>
      </div>
    </div>
  );
}
