import type { VacationStore } from '../types';

export async function fetchVacations(): Promise<VacationStore> {
  const res = await fetch('/api/vacations');
  if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? 'Failed to load');
  return res.json() as Promise<VacationStore>;
}

export async function saveVacations(data: VacationStore): Promise<void> {
  const res = await fetch('/api/vacations', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? 'Failed to save');
}
