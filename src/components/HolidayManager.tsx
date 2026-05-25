import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { Country, Holiday } from '../types';

interface Props {
  holidays: Holiday[];
  onAdd: (h: Omit<Holiday, 'id'>) => void;
  onRemove: (id: string) => void;
  readOnly?: boolean;
}

const COUNTRY_TINT: Record<Country, string> = {
  IN: 'bg-amber-50 text-amber-800 border-amber-200',
  US: 'bg-sky-50 text-sky-800 border-sky-200',
};

const COUNTRY_BADGE: Record<Country, string> = {
  IN: 'bg-amber-500 text-white',
  US: 'bg-sky-500 text-white',
};

export default function HolidayManager({ holidays, onAdd, onRemove, readOnly = false }: Props) {
  const [tab, setTab] = useState<Country>('IN');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const commit = () => {
    const n = name.trim();
    if (!n || !date) return;
    if (holidays.some(h => h.date === date && h.country === tab)) {
      setName(''); setDate(''); setAdding(false);
      return;
    }
    onAdd({ name: n, date, country: tab });
    setName(''); setDate(''); setAdding(false);
  };
  const cancel = () => { setAdding(false); setName(''); setDate(''); };

  const inTab = [...holidays].filter(h => (h.country ?? 'IN') === tab).sort((a, b) => a.date.localeCompare(b.date));
  const tabCounts = { IN: holidays.filter(h => (h.country ?? 'IN') === 'IN').length, US: holidays.filter(h => h.country === 'US').length };

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Company Holidays</h2>
        {readOnly && (
          <span className="text-[11px] text-gray-400 italic">Read-only · set by admin</span>
        )}
      </div>

      {/* Country tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 w-fit mb-4">
        {(['IN', 'US'] as Country[]).map(c => (
          <button
            key={c}
            onClick={() => { setTab(c); cancel(); }}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              tab === c
                ? c === 'IN' ? 'bg-white text-amber-700 shadow-sm' : 'bg-white text-sky-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
              tab === c ? COUNTRY_BADGE[c] : 'bg-gray-200 text-gray-500'
            }`}>
              {c}
            </span>
            {c === 'IN' ? 'India' : 'United States'}
            <span className="text-[11px] text-gray-400">{tabCounts[c]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {inTab.length === 0 && !adding && (
          <span className="text-sm text-gray-400">
            {readOnly
              ? `No ${tab === 'IN' ? 'India' : 'US'} holidays yet.`
              : `No ${tab === 'IN' ? 'India' : 'US'} holidays added yet.`}
          </span>
        )}
        {inTab.map(h => (
          <span key={h.id} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${COUNTRY_TINT[tab]}`}>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${COUNTRY_BADGE[tab]}`}>{tab}</span>
            <span className="font-medium">{h.name}</span>
            <span className="text-xs opacity-70">{format(parseISO(h.date), 'MMM d, yyyy')}</span>
            {!readOnly && (
              <button
                onClick={() => onRemove(h.id)}
                className="opacity-50 hover:opacity-100 text-base leading-none transition-opacity"
                title={`Remove ${h.name}`}
              >
                ×
              </button>
            )}
          </span>
        ))}

        {!readOnly && (adding ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
              placeholder={`${tab === 'IN' ? 'India' : 'US'} holiday name`}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-44"
            />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={commit}
              disabled={!name.trim() || !date}
              className={`text-white rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-40 transition-colors ${
                tab === 'IN' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-sky-500 hover:bg-sky-600'
              }`}
            >
              Add to {tab}
            </button>
            <button onClick={cancel} className="text-gray-400 hover:text-gray-600 text-sm px-2">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed text-sm transition-colors ${
              tab === 'IN'
                ? 'border-gray-300 text-gray-400 hover:border-amber-400 hover:text-amber-600'
                : 'border-gray-300 text-gray-400 hover:border-sky-400 hover:text-sky-600'
            }`}
          >
            + Add {tab === 'IN' ? 'India' : 'US'} Holiday
          </button>
        ))}
      </div>
    </section>
  );
}
