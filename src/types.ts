export interface Person { id: string; name: string }
export interface Vacation { id: string; personId: string; startDate: string; endDate: string; note?: string }
export interface VacationStore { people: Person[]; vacations: Vacation[]; lastUpdated?: string }
