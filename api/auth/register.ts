import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { hashPassword, signToken } from '../_lib/auth';
import { randomUUID } from 'crypto';

async function ensureUsersTable(sql: ReturnType<typeof neon>) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      username     TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body ?? {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if (typeof password === 'string' && password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (!process.env.DATABASE_URL) return res.status(500).json({ error: 'DATABASE_URL not set' });

  const sql = neon(process.env.DATABASE_URL);
  await ensureUsersTable(sql);

  const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
  if (existing.length) return res.status(409).json({ error: 'Username already taken' });

  const id = randomUUID();
  const password_hash = await hashPassword(password);
  await sql`INSERT INTO users (id, username, password_hash) VALUES (${id}, ${username}, ${password_hash})`;

  const token = signToken(id, username);
  return res.json({ token, username });
}
