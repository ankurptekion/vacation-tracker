export type Country = 'IN' | 'US';

export const COUNTRY_LABELS: Record<Country, string> = {
  IN: 'India',
  US: 'United States',
};

export interface Person { id: string; name: string; country?: Country }
export interface Vacation { id: string; personId: string; startDate: string; endDate: string; note?: string }
export interface Holiday { id: string; name: string; date: string; country?: Country }
export interface VacationStore {
  people: Person[];
  vacations: Vacation[];
  holidays?: Holiday[];
  lastUpdated?: string;
}
