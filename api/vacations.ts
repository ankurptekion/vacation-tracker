import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { createHmac } from 'crypto';

interface Person { id: string; name: string }
interface Vacation { id: string; personId: string; startDate: string; endDate: string; note?: string }
interface Holiday { id: string; name: string; date: string }
interface VacationStore { people: Person[]; vacations: Vacation[]; holidays?: Holiday[]; lastUpdated?: string }

type AuthUser = { sub: string; username: string; role: 'admin' | 'user' };

function verifyToken(token: string): AuthUser | null {
  try {
    const [header, payload, sig] = token.split('.');
    if (!header || !payload || !sig) return null;
    const secret = process.env.JWT_SECRET ?? 'fallback-secret';
    const expected = Buffer.from(
      createHmac('sha256', secret).update(`${header}.${payload}`).digest()
    ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    if (expected !== sig) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as AuthUser & { exp: number };
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: data.sub, username: data.username, role: data.role ?? 'user' };
  } catch {
    return null;
  }
}

function getAuthUser(req: VercelRequest): AuthUser | null {
  const auth = (req.headers['authorization'] as string) ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}

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

function samePeople(a: Person[], b: Person[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x.id.localeCompare(y.id));
  const sb = [...b].sort((x, y) => x.id.localeCompare(y.id));
  return sa.every((p, i) => p.id === sb[i].id && p.name === sb[i].name);
}

function sameHolidays(a: Holiday[], b: Holiday[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x.id.localeCompare(y.id));
  const sb = [...b].sort((x, y) => x.id.localeCompare(y.id));
  return sa.every((h, i) => h.id === sb[i].id && h.name === sb[i].name && h.date === sb[i].date);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL is not set. Add Neon storage in your Vercel project.' });
  }

  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const sql = await db();

    if (req.method === 'GET') {
      const rows = await sql`SELECT data FROM vacation_data WHERE id = 'singleton'`;
      return res.json(rows[0]?.data ?? { people: [], vacations: [] });
    }

    if (req.method === 'PUT') {
      const incoming = req.body as VacationStore;

      if (user.role !== 'admin') {
        const rows = await sql`SELECT data FROM vacation_data WHERE id = 'singleton'`;
        const existing = (rows[0]?.data ?? { people: [], vacations: [], holidays: [] }) as VacationStore;
        if (!samePeople(incoming.people ?? [], existing.people ?? [])) {
          return res.status(403).json({ error: 'Only admin can add or remove team members' });
        }
        if (!sameHolidays(incoming.holidays ?? [], existing.holidays ?? [])) {
          return res.status(403).json({ error: 'Only admin can manage holidays' });
        }
      }

      const store: VacationStore = { ...incoming, lastUpdated: new Date().toISOString() };
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
