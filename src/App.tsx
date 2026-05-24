import { useCallback, useEffect, useState } from 'react';
import type { Person, Vacation, VacationStore } from './types';
import { fetchVacations, saveVacations } from './lib/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import PeopleManager from './components/PeopleManager';
import VacationTimeline from './components/VacationTimeline';
import CalendarView from './components/CalendarView';
import AddVacationModal from './components/AddVacationModal';
import LoginScreen from './components/LoginScreen';

function AppInner() {
  const { isAuthenticated } = useAuth();
  const [store, setStore] = useState<VacationStore>({ people: [], vacations: [] });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<'timeline' | 'calendar'>('timeline');

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    fetchVacations().then(d => { setStore(d); setLastSynced(new Date()); })
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
  };
  const addVacation = (v: Omit<Vacation, 'id'>) => {
    const next = { ...store, vacations: [...store.vacations, { ...v, id: crypto.randomUUID() }] };
    setStore(next); void persist(next); setShowModal(false);
  };
  const removeVacation = (id: string) => {
    const next = { ...store, vacations: store.vacations.filter(v => v.id !== id) };
    setStore(next); void persist(next);
  };

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
        <PeopleManager people={store.people} onAdd={addPerson} onRemove={removePerson} />

        {/* View toggle */}
        <div className="flex items-center justify-between">
          <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setView('timeline')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                view === 'timeline'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                view === 'calendar'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>

        {view === 'timeline' ? (
          <VacationTimeline people={store.people} vacations={store.vacations} onRemove={removeVacation} onAdd={() => setShowModal(true)} />
        ) : (
          <CalendarView people={store.people} vacations={store.vacations} />
        )}
      </main>
      {showModal && <AddVacationModal people={store.people} onAdd={addVacation} onClose={() => setShowModal(false)} />}
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
