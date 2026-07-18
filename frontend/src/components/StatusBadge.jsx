const STYLES = {
  New: 'bg-slate-100 text-slate-600',
  'In Counseling': 'bg-amber-soft text-amber',
  Converted: 'bg-emerald-100 text-good',
  Dropped: 'bg-red-50 text-warn',
  Counseling: 'bg-amber-soft text-amber',
  Applied: 'bg-sky-50 text-sky-700',
  Offer: 'bg-emerald-100 text-good',
  Rejected: 'bg-red-50 text-warn',
  'Not Interested': 'bg-slate-100 text-slate-500',
  Active: 'bg-emerald-100 text-good',
  Cancelled: 'bg-red-50 text-warn',
  Completed: 'bg-sky-50 text-sky-700',
  Pending: 'bg-amber-soft text-amber',
  Partial: 'bg-sky-50 text-sky-700',
  Received: 'bg-emerald-100 text-good',
};

export default function StatusBadge({ status }) {
  const cls = STYLES[status] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
