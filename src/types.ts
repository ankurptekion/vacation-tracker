export interface Person { id: string; name: string }
export interface Vacation { id: string; personId: string; startDate: string; endDate: string; note?: string }
export interface Holiday { id: string; name: string; date: string }
export interface VacationStore {
  people: Person[];
  vacations: Vacation[];
  holidays?: Holiday[];
  lastUpdated?: string;
}
