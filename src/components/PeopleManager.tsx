import { useState } from 'react';
import type { Person } from '../types';

export const PERSON_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-amber-100 text-amber-700 border-amber-200',
];

interface Props { people: Person[]; onAdd: (name: string) => void; onRemove: (id: string) => void }

export default function PeopleManager({ people, onAdd, onRemove }: Props) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const commit = () => {
    const t = newName.trim();
    if (!t) return;
    onAdd(t); setNewName(''); setAdding(false);
  };
  const cancel = () => { setAdding(false); setNewName(''); };

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Team Members</h2>
      <div className="flex flex-wrap gap-2 items-center">
        {people.map((p, i) => (
          <span key={p.id} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-medium ${PERSON_COLORS[i % PERSON_COLORS.length]}`}>
            {p.name}
            <button onClick={() => onRemove(p.id)} className="ml-0.5 opacity-40 hover:opacity-100 transition-opacity text-base leading-none" title={`Remove ${p.name}`}>×</button>
          </span>
        ))}
        {adding ? (
          <div className="flex items-center gap-2">
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
              placeholder="Name" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 w-36" />
            <button onClick={commit} disabled={!newName.trim()} className="bg-sky-500 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-sky-600 disabled:opacity-40 transition-colors">Add</button>
            <button onClick={cancel} className="text-gray-400 hover:text-gray-600 text-sm px-2">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-sm text-gray-400 hover:border-sky-400 hover:text-sky-600 transition-colors">
            + Add Person
          </button>
        )}
      </div>
    </section>
  );
}
