import { format } from 'date-fns';

interface Props { syncing: boolean; lastSynced: Date | null; error: string | null }

export default function Header({ syncing, lastSynced, error }: Props) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team Vacation Tracker</h1>
          <p className="text-xs text-gray-400 mt-0.5">Powered by Neon · Deployed on Vercel</p>
        </div>
        <div className="text-sm">
          {error
            ? <span className="text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-full text-xs">{error}</span>
            : syncing
            ? <span className="text-sky-600 flex items-center gap-1.5"><span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />Saving…</span>
            : lastSynced
            ? <span className="text-green-600 flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full" />Saved {format(lastSynced, 'h:mm a')}</span>
            : null}
        </div>
      </div>
    </header>
  );
}
