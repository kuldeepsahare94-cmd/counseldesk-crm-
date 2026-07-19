import { useState } from 'react';
import { Database } from 'lucide-react';
import GeographyManager from '../components/GeographyManager';
import UniversitiesManager from '../components/UniversitiesManager';
import IntakesManager from '../components/IntakesManager';
import OptionListManager from '../components/OptionListManager';

const TABS = [
  { key: 'geography', label: 'Geography' },
  { key: 'universities', label: 'Universities & Courses' },
  { key: 'intakes', label: 'Intakes' },
  { key: 'lead_source', label: 'Lead Sources' },
  { key: 'english_test', label: 'English Tests' },
  { key: 'document_type', label: 'Document Types' },
  { key: 'payment_mode', label: 'Payment Modes' },
  { key: 'student_status', label: 'Student Status' },
  { key: 'application_status', label: 'Application Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'tag', label: 'Tags' },
];

export default function MasterData() {
  const [tab, setTab] = useState('geography');
  const activeLabel = TABS.find((t) => t.key === tab)?.label;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-soft text-amber flex items-center justify-center">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink" style={{ fontFamily: 'var(--font-display)' }}>
            Master Data
          </h1>
          <p className="text-sm text-slate-500 mt-1">The shared lists every module pulls from.</p>
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

      <div className="mt-6">
        {tab === 'geography' && <GeographyManager />}
        {tab === 'universities' && <UniversitiesManager />}
        {tab === 'intakes' && <IntakesManager />}
        {!['geography', 'universities', 'intakes'].includes(tab) && (
          <OptionListManager listType={tab} label={activeLabel} />
        )}
      </div>
    </div>
  );
}
