import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function signToken(userId: string, username: string, role: 'admin' | 'user'): string {
  const secret = process.env.JWT_SECRET ?? 'fallback-secret';
  const header  = b64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = b64url(Buffer.from(JSON.stringify({
    sub: userId, username, role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  })));
  const sig = b64url(createHmac('sha256', secret).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${sig}`;
}

const CREDENTIALS: Record<string, { password: string; role: 'admin' | 'user' }> = {
  admin: { password: 'admin', role: 'admin' },
  user:  { password: 'user',  role: 'user'  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body ?? {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const found = CREDENTIALS[username];
  if (!found || found.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(`static-${username}`, username, found.role);
  return res.json({ token, username, role: found.role });
}
