import type { VacationStore } from '../types';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('vt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handle401() {
  localStorage.removeItem('vt_token');
  localStorage.removeItem('vt_username');
  localStorage.removeItem('vt_role');
  window.location.reload();
}

export async function fetchVacations(): Promise<VacationStore> {
  const res = await fetch('/api/vacations', {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) { handle401(); throw new Error('Session expired'); }
  if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? 'Failed to load');
  return res.json() as Promise<VacationStore>;
}

export async function saveVacations(data: VacationStore): Promise<void> {
  const res = await fetch('/api/vacations', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (res.status === 401) { handle401(); throw new Error('Session expired'); }
  if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? 'Failed to save');
}
