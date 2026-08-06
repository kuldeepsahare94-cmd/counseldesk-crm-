import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { api } from '../api';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ inquiries: [], students: [], institutions: [] });
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults({ inquiries: [], students: [], institutions: [] }); return; }
    setLoading(true);
    const q = query.trim().toLowerCase();
    const timer = setTimeout(async () => {
      const [inquiries, students, institutions] = await Promise.all([
        api.listInquiries({}), api.listStudents(), api.listInstitutions(),
      ]);
      setResults({
        inquiries: inquiries.filter((i) => i.name?.toLowerCase().includes(q) || i.phone?.includes(q)).slice(0, 5),
        students: students.filter((s) => s.name?.toLowerCase().includes(q) || s.phone?.includes(q)).slice(0, 5),
        institutions: institutions.filter((i) => i.name?.toLowerCase().includes(q)).slice(0, 5),
      });
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const goTo = (path) => {
    navigate(path);
    setOpen(false);
    setQuery('');
  };

  const hasResults = results.inquiries.length || results.students.length || results.institutions.length;

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="flex items-center bg-canvas border border-line rounded-lg px-3 py-2">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search inquiries, students, institutions…"
          className="bg-transparent border-0 outline-none text-sm px-2 flex-1 min-w-0"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-slate-400 hover:text-ink shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-line rounded-xl shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto">
          {loading && <p className="text-xs text-slate-400 px-4 py-3">Searching…</p>}
          {!loading && !hasResults && <p className="text-xs text-slate-400 px-4 py-3">No matches.</p>}

          {results.inquiries.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 px-4 pt-3 pb-1">Inquiries</div>
              {results.inquiries.map((i) => (
                <button key={i.id} onClick={() => goTo(`/inquiries/${i.id}`)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-canvas flex justify-between">
                  <span className="text-ink font-medium">{i.name}</span>
                  <span className="text-slate-400 text-xs">{i.phone}</span>
                </button>
              ))}
            </div>
          )}
          {results.students.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 px-4 pt-3 pb-1">Students</div>
              {results.students.map((s) => (
                <button key={s.id} onClick={() => goTo(`/students/${s.id}`)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-canvas flex justify-between">
                  <span className="text-ink font-medium">{s.name}</span>
                  <span className="text-slate-400 text-xs">{s.phone}</span>
                </button>
              ))}
            </div>
          )}
          {results.institutions.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 px-4 pt-3 pb-1">Institutions</div>
              {results.institutions.map((i) => (
                <button key={i.id} onClick={() => goTo(`/institutions/${i.id}`)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-canvas">
                  <span className="text-ink font-medium">{i.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
