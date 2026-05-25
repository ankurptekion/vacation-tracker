import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface Props { syncing: boolean; lastSynced: Date | null; error: string | null }

export default function Header({ syncing, lastSynced, error }: Props) {
  const { username, role, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="https://cdn.prod.website-files.com/685291c1265e608fdfed1a69/68b569bb747a7ae841220742_1060598de6679bda28a5c166339d95bc_Logo.svg"
            alt="Tekion"
            className="h-7 w-auto"
          />
          <span className="h-6 w-px bg-gray-200" aria-hidden="true" />
          <h1 className="text-lg font-semibold text-gray-900">Team Vacation Tracker</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm">
            {error
              ? <span className="text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-full text-xs">{error}</span>
              : syncing
              ? <span className="text-sky-600 flex items-center gap-1.5"><span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />Saving…</span>
              : lastSynced
              ? <span className="text-green-600 flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full" />Saved {format(lastSynced, 'h:mm a')}</span>
              : null}
          </div>
          {username && (
            <div className="flex items-center gap-2">
              <span className="bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                {username}
                {role && (
                  <span className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${
                    role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {role}
                  </span>
                )}
              </span>
              <button
                onClick={logout}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
