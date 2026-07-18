import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Students() {
  const [list, setList] = useState([]);
  useEffect(() => { api.listStudents().then(setList); }, []);

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
        Students
      </h1>
      <p className="text-sm text-slate-500 mt-1">Converted from inquiries. Enroll them into their chosen institution.</p>

      <div className="bg-white border border-line rounded-xl mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-canvas border-b border-line">
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Phone</th>
              <th className="py-3 px-4 font-medium">Converted on</th>
              <th className="py-3 px-4 font-medium text-right">Enrollments</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-b border-line/60 hover:bg-canvas/60">
                <td className="py-3 px-4">
                  <Link to={`/students/${s.id}`} className="text-ink font-medium hover:text-amber">{s.name}</Link>
                </td>
                <td className="py-3 px-4 text-slate-500">{s.phone}</td>
                <td className="py-3 px-4 text-slate-400 text-xs">{s.converted_at}</td>
                <td className="py-3 px-4 text-right">{s.enrollment_count}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-slate-400">No students yet — convert an inquiry first.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
