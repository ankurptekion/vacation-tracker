import { useCallback, useEffect, useState } from 'react';
import type { Holiday, Person, Vacation, VacationStore } from './types';
import { fetchVacations, saveVacations } from './lib/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import PeopleManager from './components/PeopleManager';
import { PERSON_COLORS } from './components/PeopleManager';
import VacationTimeline from './components/VacationTimeline';
import CalendarView from './components/CalendarView';
import AddVacationModal from './components/AddVacationModal';
import LoginScreen from './components/LoginScreen';
import SummaryCard from './components/SummaryCard';
import HolidayManager from './components/HolidayManager';

function AppInner() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [store, setStore] = useState<VacationStore>({ people: [], vacations: [], holidays: [] });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Vacation | null>(null);
  const [view, setView] = useState<'timeline' | 'calendar'>('timeline');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    fetchVacations().then(d => { setStore({ holidays: [], ...d }); setLastSynced(new Date()); })
      .catch(e => setError((e as Error).message)).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const persist = useCallback(async (next: VacationStore) => {
    setSyncing(true); setError(null);
    try { await saveVacations(next); setLastSynced(new Date()); }
    catch (e) { setError((e as Error).message); }
    finally { setSyncing(false); }
  }, []);

  const addPerson = (name: string) => {
    const next = { ...store, people: [...store.people, { id: crypto.randomUUID(), name } as Person] };
    setStore(next); void persist(next);
  };
  const removePerson = (id: string) => {
    const next = { ...store, people: store.people.filter(p => p.id !== id), vacations: store.vacations.filter(v => v.personId !== id) };
    setStore(next); void persist(next);
    setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  };
  const saveVacation = (v: Omit<Vacation, 'id'>) => {
    const overlap = store.vacations.find(existing =>
      existing.id !== editing?.id &&
      existing.personId === v.personId &&
      existing.startDate <= v.endDate &&
      existing.endDate >= v.startDate
    );
    if (overlap) return;
    const next = editing
      ? { ...store, vacations: store.vacations.map(x => x.id === editing.id ? { ...v, id: editing.id } : x) }
      : { ...store, vacations: [...store.vacations, { ...v, id: crypto.randomUUID() }] };
    setStore(next); void persist(next);
    setShowModal(false); setEditing(null);
  };
  const removeVacation = (id: string) => {
    const next = { ...store, vacations: store.vacations.filter(v => v.id !== id) };
    setStore(next); void persist(next);
  };
  const openAdd  = () => { setEditing(null); setShowModal(true); };
  const openEdit = (v: Vacation) => { setEditing(v); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const addHoliday = (h: Omit<Holiday, 'id'>) => {
    const holidays = store.holidays ?? [];
    if (holidays.some(x => x.date === h.date)) return;
    const next = { ...store, holidays: [...holidays, { ...h, id: crypto.randomUUID() }] };
    setStore(next); void persist(next);
  };
  const removeHoliday = (id: string) => {
    const next = { ...store, holidays: (store.holidays ?? []).filter(h => h.id !== id) };
    setStore(next); void persist(next);
  };

  const togglePerson = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const visibleVacations = selectedIds.size === 0
    ? store.vacations
    : store.vacations.filter(v => selectedIds.has(v.personId));

  if (!isAuthenticated) return <LoginScreen />;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header syncing={syncing} lastSynced={lastSynced} error={error} />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        {isAdmin && <SummaryCard people={store.people} vacations={store.vacations} />}
        <PeopleManager people={store.people} onAdd={addPerson} onRemove={removePerson} readOnly={!isAdmin} />
        {isAdmin && <HolidayManager holidays={store.holidays ?? []} onAdd={addHoliday} onRemove={removeHoliday} />}

        {/* Controls row: filter + view toggle */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Person filter */}
          {store.people.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-medium">Show:</span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  selectedIds.size === 0
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-sky-300 hover:text-sky-600'
                }`}
              >
                All
              </button>
              {store.people.map((p, i) => {
                const active = selectedIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePerson(p.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      active
                        ? PERSON_COLORS[i % PERSON_COLORS.length]
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 ml-auto">
            <button
              onClick={() => setView('timeline')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                view === 'timeline' ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                view === 'calendar' ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>

        {view === 'timeline' ? (
          <VacationTimeline people={store.people} vacations={visibleVacations} onRemove={removeVacation} onEdit={openEdit} onAdd={openAdd} />
        ) : (
          <CalendarView people={store.people} vacations={visibleVacations} holidays={store.holidays ?? []} />
        )}
      </main>
      {showModal && (
        <AddVacationModal
          people={store.people}
          vacations={store.vacations}
          initial={editing ?? undefined}
          onSave={saveVacation}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
