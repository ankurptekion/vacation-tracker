import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { getAuthUser } from './_lib/auth';

interface Person { id: string; name: string }
interface Vacation { id: string; personId: string; startDate: string; endDate: string; note?: string }
interface VacationStore { people: Person[]; vacations: Vacation[]; lastUpdated?: string }

let tableReady = false;

async function db() {
  const sql = neon(process.env.DATABASE_URL!);
  if (!tableReady) {
    await sql`
      CREATE TABLE IF NOT EXISTS vacation_data (
        id   TEXT PRIMARY KEY,
        data JSONB       NOT NULL DEFAULT '{"people":[],"vacations":[]}',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`;
    tableReady = true;
  }
  return sql;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL is not set. Add Neon storage in your Vercel project.' });
  }

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const sql = await db();

    if (req.method === 'GET') {
      const rows = await sql`SELECT data FROM vacation_data WHERE id = 'singleton'`;
      return res.json(rows[0]?.data ?? { people: [], vacations: [] });
    }

    if (req.method === 'PUT') {
      const store: VacationStore = { ...(req.body as VacationStore), lastUpdated: new Date().toISOString() };
      const json = JSON.stringify(store);
      await sql`
        INSERT INTO vacation_data (id, data) VALUES ('singleton', ${json})
        ON CONFLICT (id) DO UPDATE SET data = ${json}, updated_at = NOW()`;
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
