import type { VercelRequest, VercelResponse } from '@vercel/node';
import { signToken } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body ?? {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  if (username !== 'test' || password !== 'test') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken('static-user-id', username);
  return res.json({ token, username });
}
