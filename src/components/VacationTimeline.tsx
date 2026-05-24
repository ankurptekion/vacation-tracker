import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import type { Person, Vacation } from '../types';
import { PERSON_COLORS } from './PeopleManager';

const BAR = ['bg-blue-400','bg-emerald-400','bg-purple-400','bg-orange-400','bg-pink-400','bg-teal-400','bg-indigo-400','bg-amber-400'];

function groupByMonth(vs: Vacation[]) {
  const map = new Map<string, Vacation[]>();
  for (const v of vs) {
    const k = v.startDate.slice(0, 7);
    (map.get(k) ?? (map.set(k, []), map.get(k)!)).push(v);
  }
  return [...map.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([k, items]) => ({
    label: format(parseISO(k + '-01'), 'MMMM yyyy'),
    items: items.sort((a,b) => a.startDate.localeCompare(b.startDate)),
  }));
}

interface Props {
  people: Person[];
  vacations: Vacation[];
  onRemove: (id: string) => void;
  onEdit: (v: Vacation) => void;
  onAdd: () => void;
}

export default function VacationTimeline({ people, vacations, onRemove, onEdit, onAdd }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const upcoming = vacations.filter(v => v.endDate >= today);
  const past     = vacations.filter(v => v.endDate <  today);
  const idx  = (id: string) => people.findIndex(p => p.id === id);
  const name = (id: string) => people.find(p => p.id === id)?.name ?? 'Unknown';

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vacation Schedule</h2>
        <button onClick={onAdd} disabled={!people.length}
          className="bg-sky-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          + Add Vacation
        </button>
      </div>

      {!vacations.length ? (
        <div className="text-center py-14 text-gray-400">
          <div className="text-4xl mb-3">✈️</div>
          <p className="font-medium text-gray-500">No vacations scheduled yet</p>
          <p className="text-sm mt-1">{!people.length ? 'Add team members above first' : 'Click "+ Add Vacation" to get started'}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupByMonth(upcoming).map(g => <MonthGroup key={g.label} group={g} idx={idx} name={name} onRemove={onRemove} onEdit={onEdit} />)}
          {past.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">Past</p>
              <div className="space-y-5 opacity-50">
                {groupByMonth(past).map(g => <MonthGroup key={g.label} group={g} idx={idx} name={name} onRemove={onRemove} onEdit={onEdit} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function MonthGroup({ group, idx, name, onRemove, onEdit }: {
  group: { label: string; items: Vacation[] };
  idx: (id: string) => number;
  name: (id: string) => string;
  onRemove: (id: string) => void;
  onEdit: (v: Vacation) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-500 mb-2">{group.label}</p>
      <div className="space-y-2">
        {group.items.map(v => {
          const i = idx(v.personId);
          const days = differenceInCalendarDays(parseISO(v.endDate), parseISO(v.startDate)) + 1;
          return (
            <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 group hover:border-gray-200 transition-colors">
              <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${BAR[i % BAR.length]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PERSON_COLORS[i % PERSON_COLORS.length]}`}>{name(v.personId)}</span>
                  <span className="text-xs text-gray-400">{days} day{days !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{format(parseISO(v.startDate), 'MMM d')} – {format(parseISO(v.endDate), 'MMM d, yyyy')}</p>
                {v.note && <p className="text-xs text-gray-400 mt-0.5">{v.note}</p>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(v)}
                  className="text-gray-400 hover:text-sky-500 text-sm px-2 py-1 rounded hover:bg-sky-50 transition-colors"
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  onClick={() => onRemove(v.id)}
                  className="text-gray-300 hover:text-red-400 text-xl leading-none px-1.5"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
