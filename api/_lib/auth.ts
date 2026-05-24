import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import type { VercelRequest } from '@vercel/node';

const scryptAsync = promisify(scrypt);

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function getSecret(): string {
  return process.env.JWT_SECRET ?? process.env.DATABASE_URL ?? 'fallback-secret';
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, 'hex');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  if (hashBuf.length !== derived.length) return false;
  return timingSafeEqual(hashBuf, derived);
}

export function signToken(userId: string, username: string): string {
  const header  = b64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = b64url(Buffer.from(JSON.stringify({
    sub: userId,
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  })));
  const sig = b64url(createHmac('sha256', getSecret()).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${sig}`;
}

export function verifyToken(token: string): { sub: string; username: string } | null {
  try {
    const [header, payload, sig] = token.split('.');
    if (!header || !payload || !sig) return null;
    const expected = b64url(createHmac('sha256', getSecret()).update(`${header}.${payload}`).digest());
    if (expected !== sig) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { sub: string; username: string; exp: number };
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: data.sub, username: data.username };
  } catch {
    return null;
  }
}

export function getAuthUser(req: VercelRequest): { sub: string; username: string } | null {
  const auth = (req.headers['authorization'] as string) ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}
