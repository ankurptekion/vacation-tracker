import { useState } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isToday, getDay, parseISO, addMonths, subMonths,
} from 'date-fns';
import type { Person, Vacation, Holiday, Country } from '../types';

const HOLIDAY_TINT: Record<Country, { cell: string; chip: string; date: string }> = {
  IN: { cell: 'bg-amber-50',  chip: 'bg-amber-100 text-amber-800',  date: 'text-amber-800' },
  US: { cell: 'bg-sky-50',    chip: 'bg-sky-100 text-sky-800',      date: 'text-sky-800' },
};
const DEFAULT_HOLIDAY_TINT = { cell: 'bg-amber-50', chip: 'bg-amber-100 text-amber-800', date: 'text-amber-800' };

const BAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-amber-100 text-amber-700',
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props { people: Person[]; vacations: Vacation[]; holidays?: Holiday[] }

interface BarInfo {
  personIdx: number;
  personName: string;
  startDate: string;
  endDate: string;
  note?: string;
  roundLeft: boolean;
  roundRight: boolean;
  showName: boolean;
}

interface DayDetail {
  personIdx: number;
  personName: string;
  startDate: string;
  endDate: string;
  note?: string;
}

export default function CalendarView({ people, vacations, holidays = [] }: Props) {
  const holidaysByDate = new Map<string, Holiday[]>();
  for (const h of holidays) {
    const arr = holidaysByDate.get(h.date) ?? [];
    arr.push(h);
    holidaysByDate.set(h.date, arr);
  }
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [expandedDay, setExpandedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(current);
  const monthEnd   = endOfMonth(current);
  const startDow   = (getDay(monthStart) + 6) % 7;
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const gridCells: (Date | null)[] = [...Array(startDow).fill(null), ...daysInMonth];
  const rem = gridCells.length % 7;
  if (rem !== 0) for (let i = 0; i < 7 - rem; i++) gridCells.push(null);

  function getBarsForDay(day: Date, col: number): BarInfo[] {
    const dayStr = format(day, 'yyyy-MM-dd');
    const bars: BarInfo[] = [];
    for (const v of vacations) {
      if (v.startDate > dayStr || v.endDate < dayStr) continue;
      const idx = people.findIndex(p => p.id === v.personId);
      if (idx === -1) continue;
      const isStart    = v.startDate === dayStr;
      const isEnd      = v.endDate   === dayStr;
      const isWeekStart = col === 0;
      const isWeekEnd   = col === 6;
      bars.push({
        personIdx: idx,
        personName: people[idx].name,
        startDate: v.startDate,
        endDate: v.endDate,
        note: v.note,
        roundLeft:  isStart || isWeekStart,
        roundRight: isEnd   || isWeekEnd,
        showName:   isStart || isWeekStart,
      });
    }
    return bars.sort((a, b) => a.personIdx - b.personIdx);
  }

  function getDayDetails(day: Date): DayDetail[] {
    const dayStr = format(day, 'yyyy-MM-dd');
    const details: DayDetail[] = [];
    for (const v of vacations) {
      if (v.startDate > dayStr || v.endDate < dayStr) continue;
      const idx = people.findIndex(p => p.id === v.personId);
      if (idx === -1) continue;
      details.push({
        personIdx: idx,
        personName: people[idx].name,
        startDate: v.startDate,
        endDate: v.endDate,
        note: v.note,
      });
    }
    return details.sort((a, b) => a.personIdx - b.personIdx);
  }

  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr   = format(monthEnd, 'yyyy-MM-dd');
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
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors text-xl leading-none"
        >
          ‹
        </button>
        <h2 className="text-base font-semibold text-gray-800">{format(current, 'MMMM yyyy')}</h2>
        <button
          onClick={() => setCurrent(addMonths(current, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors text-xl leading-none"
        >
          ›
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-t border-gray-100 rounded-lg overflow-hidden">
        {WEEKDAYS.map((wd, i) => (
          <div
            key={wd}
            className={`py-2 text-center text-xs font-semibold text-gray-400 border-r border-b border-gray-100 ${i >= 5 ? 'bg-gray-50' : 'bg-white'}`}
          >
            {wd}
          </div>
        ))}

        {gridCells.map((day, cellIdx) => {
          const col = cellIdx % 7;
          const isWeekend = col >= 5;

          if (!day) {
            return (
              <div
                key={`empty-${cellIdx}`}
                className={`min-h-[80px] border-r border-b border-gray-100 ${isWeekend ? 'bg-gray-50' : 'bg-white'}`}
              />
            );
          }

          const bars  = getBarsForDay(day, col);
          const shown = bars.slice(0, 3);
          const extra = bars.length - shown.length;
          const todayDay = isToday(day);
          const dayHolidays = holidaysByDate.get(format(day, 'yyyy-MM-dd')) ?? [];
          const firstHolidayTint = dayHolidays.length
            ? (dayHolidays[0].country ? HOLIDAY_TINT[dayHolidays[0].country] : DEFAULT_HOLIDAY_TINT)
            : null;
          const cellBg = firstHolidayTint
            ? firstHolidayTint.cell
            : (isWeekend ? 'bg-gray-50' : 'bg-white');

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[80px] border-r border-b border-gray-100 pt-1.5 pb-1 flex flex-col ${cellBg}`}
            >
              <div className="flex justify-center mb-1 px-1">
                <span className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full ${
                  todayDay ? 'bg-sky-500 text-white' : firstHolidayTint ? firstHolidayTint.date : 'text-gray-600'
                }`}>
                  {format(day, 'd')}
                </span>
              </div>

              {dayHolidays.map(h => {
                const tint = h.country ? HOLIDAY_TINT[h.country] : DEFAULT_HOLIDAY_TINT;
                return (
                  <div
                    key={h.id}
                    className={`mx-1 mb-px text-[10px] font-semibold leading-[18px] rounded px-1.5 truncate ${tint.chip}`}
                    title={h.country ? `${h.country} — ${h.name}` : h.name}
                    onClick={() => setExpandedDay(day)}
                  >
                    {h.country && <span className="opacity-70 mr-1">{h.country}</span>}
                    {h.name}
                  </div>
                );
              })}

              <div className="flex flex-col gap-px px-0 flex-1">
                {shown.map((bar, bi) => {
                  const range = `${format(parseISO(bar.startDate), 'MMM d')} – ${format(parseISO(bar.endDate), 'MMM d, yyyy')}`;
                  const tip = `${bar.personName}\n${range}${bar.note ? `\n${bar.note}` : ''}`;
                  return (
                    <button
                      key={bi}
                      title={tip}
                      onClick={() => setExpandedDay(day)}
                      className={`h-[18px] leading-[18px] text-[10px] font-medium truncate px-1.5 cursor-pointer text-left hover:brightness-95
                        ${BAR_COLORS[bar.personIdx % BAR_COLORS.length]}
                        ${bar.roundLeft  ? 'rounded-l-full ml-1'  : '-ml-px'}
                        ${bar.roundRight ? 'rounded-r-full mr-1' : '-mr-px'}
                      `}
                    >
                      {bar.showName
                        ? (bar.note ? `${bar.personName} · ${bar.note}` : bar.personName)
                        : ' '}
                    </button>
                  );
                })}
                {extra > 0 && (
                  <button
                    onClick={() => setExpandedDay(day)}
                    className="text-[10px] text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded px-1 mt-px transition-colors text-left font-medium"
                  >
                    +{extra} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {legendIndices.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {legendIndices.map(idx => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${BAR_COLORS[idx % BAR_COLORS.length]}`}>
                {people[idx]?.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Day details popover */}
      {expandedDay && (
        <DayDetailsModal
          day={expandedDay}
          dayHolidays={holidaysByDate.get(format(expandedDay, 'yyyy-MM-dd')) ?? []}
          details={getDayDetails(expandedDay)}
          onClose={() => setExpandedDay(null)}
        />
      )}
    </div>
  );
}

function DayDetailsModal({ day, dayHolidays, details, onClose }: { day: Date; dayHolidays: Holiday[]; details: DayDetail[]; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{format(day, 'EEEE')}</div>
            <div className="text-base font-semibold text-gray-900">{format(day, 'MMMM d, yyyy')}</div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {dayHolidays.map(h => {
            const tint = h.country ? HOLIDAY_TINT[h.country] : DEFAULT_HOLIDAY_TINT;
            return (
              <div key={h.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${tint.cell.replace('bg-', 'border-').replace('-50', '-200')} ${tint.cell}`}>
                <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${tint.chip}`}>
                  Holiday{h.country ? ` · ${h.country}` : ''}
                </span>
                <span className={`text-sm font-medium ${tint.date}`}>{h.name}</span>
              </div>
            );
          })}
          {details.length === 0 && dayHolidays.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nothing scheduled.</p>
          )}
          {details.map((d, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BAR_COLORS[d.personIdx % BAR_COLORS.length]}`}>
                {d.personName}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600">
                  {format(parseISO(d.startDate), 'MMM d')} – {format(parseISO(d.endDate), 'MMM d, yyyy')}
                </p>
                {d.note && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{d.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
