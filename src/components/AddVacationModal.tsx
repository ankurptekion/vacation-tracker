import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';
import type { Person, Vacation } from '../types';

interface Props { people: Person[]; onAdd: (v: Omit<Vacation, 'id'>) => void; onClose: () => void }

export default function AddVacationModal({ people, onAdd, onClose }: Props) {
  const [personId, setPersonId] = useState(people[0]?.id ?? '');
  const [range, setRange] = useState<DateRange>();
  const [note, setNote] = useState('');

  const canSubmit = personId && range?.from && range?.to;

  const submit = () => {
    if (!canSubmit) return;
    onAdd({ personId, startDate: format(range.from!, 'yyyy-MM-dd'), endDate: format(range.to!, 'yyyy-MM-dd'), note: note.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add Vacation</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Team Member</label>
            <select value={personId} onChange={e => setPersonId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Dates {range?.from && range?.to && <span className="ml-2 font-normal text-sky-600">{format(range.from,'MMM d')} – {format(range.to,'MMM d, yyyy')}</span>}
            </label>
            <div className="border border-gray-200 rounded-xl p-3 flex justify-center overflow-x-auto">
              <DayPicker mode="range" selected={range} onSelect={setRange} numberOfMonths={2} fromDate={new Date()} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Note <span className="font-normal text-gray-400">(optional)</span></label>
            <input value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="e.g. Summer vacation" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
          <button onClick={submit} disabled={!canSubmit} className="bg-sky-500 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Add Vacation</button>
        </div>
      </div>
    </div>
  );
}
