import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { SignJWT, jwtVerify } from 'jose';
import type { VercelRequest } from '@vercel/node';

const scryptAsync = promisify(scrypt);

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET ?? process.env.DATABASE_URL ?? 'fallback-secret';
  return new TextEncoder().encode(s);
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

export async function signToken(userId: string, username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<{ sub: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { sub: payload.sub as string, username: payload['username'] as string };
  } catch {
    return null;
  }
}

export async function getAuthUser(req: VercelRequest): Promise<{ sub: string; username: string } | null> {
  const auth = req.headers['authorization'] ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  return verifyToken(token);
}
