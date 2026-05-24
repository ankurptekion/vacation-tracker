import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { Holiday } from '../types';

interface Props {
  holidays: Holiday[];
  onAdd: (h: Omit<Holiday, 'id'>) => void;
  onRemove: (id: string) => void;
}

export default function HolidayManager({ holidays, onAdd, onRemove }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const commit = () => {
    const n = name.trim();
    if (!n || !date) return;
    if (holidays.some(h => h.date === date)) {
      setName(''); setDate(''); setAdding(false);
      return;
    }
    onAdd({ name: n, date });
    setName(''); setDate(''); setAdding(false);
  };
  const cancel = () => { setAdding(false); setName(''); setDate(''); };

  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Company Holidays</h2>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {sorted.length === 0 && !adding && (
          <span className="text-sm text-gray-400">No holidays added yet.</span>
        )}
        {sorted.map(h => (
          <span key={h.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200 text-sm">
            <span className="font-medium">{h.name}</span>
            <span className="text-xs text-amber-700/70">{format(parseISO(h.date), 'MMM d, yyyy')}</span>
            <button
              onClick={() => onRemove(h.id)}
              className="opacity-50 hover:opacity-100 text-base leading-none transition-opacity"
              title={`Remove ${h.name}`}
            >
              ×
            </button>
          </span>
        ))}

        {adding ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
              placeholder="Holiday name"
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-40"
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
              className="bg-amber-500 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-amber-600 disabled:opacity-40 transition-colors"
            >
              Add
            </button>
            <button onClick={cancel} className="text-gray-400 hover:text-gray-600 text-sm px-2">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-sm text-gray-400 hover:border-amber-400 hover:text-amber-600 transition-colors"
          >
            + Add Holiday
          </button>
        )}
      </div>
    </section>
  );
}
