import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDay,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns';
import type { Person, Vacation } from '../types';
import { PERSON_COLORS } from './PeopleManager';

// Dot colors parallel to PERSON_COLORS (solid bg for dots)
const DOT_COLORS = [
  'bg-blue-400',
  'bg-emerald-400',
  'bg-purple-400',
  'bg-orange-400',
  'bg-pink-400',
  'bg-teal-400',
  'bg-indigo-400',
  'bg-amber-400',
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
  people: Person[];
  vacations: Vacation[];
}

export default function CalendarView({ people, vacations }: Props) {
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);

  // day-of-week of the 1st: getDay returns 0=Sun..6=Sat, convert to Mon=0..Sun=6
  const startDow = (getDay(monthStart) + 6) % 7; // 0=Mon ... 6=Sun

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad with nulls at start so grid aligns to Mon
  const gridCells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...daysInMonth,
  ];

  // Pad to complete the last row
  const remainder = gridCells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) gridCells.push(null);
  }

  function vacationPeopleOnDay(day: Date): number[] {
    const dayStr = format(day, 'yyyy-MM-dd');
    const indices: number[] = [];
    for (const v of vacations) {
      if (v.startDate <= dayStr && dayStr <= v.endDate) {
        const idx = people.findIndex(p => p.id === v.personId);
        if (idx !== -1 && !indices.includes(idx)) indices.push(idx);
      }
    }
    return indices;
  }

  // Build legend: people who have any vacation in this visible month
  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');
  const legendIndices: number[] = [];
  for (const v of vacations) {
    if (v.startDate <= monthEndStr && v.endDate >= monthStartStr) {
      const idx = people.findIndex(p => p.id === v.personId);
      if (idx !== -1 && !legendIndices.includes(idx)) legendIndices.push(idx);
    }
  }
  legendIndices.sort((a, b) => a - b);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrent(subMonths(current, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors text-lg"
          aria-label="Previous month"
        >
          &#8249;
        </button>
        <h2 className="text-base font-semibold text-gray-800">
          {format(current, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrent(addMonths(current, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors text-lg"
          aria-label="Next month"
        >
          &#8250;
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Weekday headers */}
        {WEEKDAYS.map((wd, i) => (
          <div
            key={wd}
            className={`py-2 text-center text-xs font-semibold text-gray-500 ${
              i >= 5 ? 'bg-gray-50' : 'bg-white'
            }`}
          >
            {wd}
          </div>
        ))}

        {/* Day cells */}
        {gridCells.map((day, cellIdx) => {
          const col = cellIdx % 7;
          const isWeekend = col >= 5;

          if (!day) {
            return (
              <div
                key={`empty-${cellIdx}`}
                className={`min-h-[72px] ${isWeekend ? 'bg-gray-50' : 'bg-white'}`}
              />
            );
          }

          const personIndices = vacationPeopleOnDay(day);
          const shown = personIndices.slice(0, 4);
          const extra = personIndices.length - shown.length;
          const todayDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[72px] p-1.5 flex flex-col ${isWeekend ? 'bg-gray-50' : 'bg-white'}`}
            >
              {/* Date number */}
              <div className="flex justify-end mb-1">
                <span
                  className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full ${
                    todayDay
                      ? 'bg-sky-500 text-white'
                      : 'text-gray-600'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Dots */}
              {shown.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-auto">
                  {shown.map((idx, di) => (
                    <span
                      key={di}
                      className={`w-1.5 h-1.5 rounded-full inline-block ${DOT_COLORS[idx % DOT_COLORS.length]}`}
                      title={people[idx]?.name}
                    />
                  ))}
                  {extra > 0 && (
                    <span className="text-[10px] text-gray-400 leading-none self-center">+{extra}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {legendIndices.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {legendIndices.map(idx => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full inline-block ${DOT_COLORS[idx % DOT_COLORS.length]}`} />
              <span className="text-xs text-gray-600">{people[idx]?.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
