import { format, addDays } from 'date-fns';
import type { Person, Vacation } from '../types';
import { PERSON_COLORS } from './PeopleManager';

interface Props { people: Person[]; vacations: Vacation[] }

export default function SummaryCard({ people, vacations }: Props) {
  const today    = format(new Date(),         'yyyy-MM-dd');
  const in30Days = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  const idx  = (id: string) => people.findIndex(p => p.id === id);
  const name = (id: string) => people.find(p => p.id === id)?.name ?? 'Unknown';

  const outToday      = vacations.filter(v => v.startDate <= today && v.endDate >= today);
  const upcomingNext  = vacations.filter(v => v.startDate > today && v.startDate <= in30Days);

  const renderChips = (vs: Vacation[]) => {
    if (!vs.length) return <span className="text-xs text-gray-400">—</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {vs.map(v => (
          <span
            key={v.id}
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${PERSON_COLORS[idx(v.personId) % PERSON_COLORS.length]}`}
            title={`${format(new Date(v.startDate), 'MMM d')} – ${format(new Date(v.endDate), 'MMM d, yyyy')}`}
          >
            {name(v.personId)}
          </span>
        ))}
      </div>
    );
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Summary</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-gray-900">{outToday.length}</span>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Out today</span>
          </div>
          {renderChips(outToday)}
        </div>
        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-gray-900">{upcomingNext.length}</span>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Next 30 days</span>
          </div>
          {renderChips(upcomingNext)}
        </div>
        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-gray-900">{people.length}</span>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Team members</span>
          </div>
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{vacations.length}</span> vacation{vacations.length === 1 ? '' : 's'} on record
          </p>
        </div>
      </div>
    </section>
  );
}
