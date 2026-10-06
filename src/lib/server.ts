// Shared helpers for the site's server routes (likes, film suggestions).
// Data lives in Upstash Redis, added through Vercel → Storage.
import type { AstroCookies } from 'astro';

export const env = (name: string): string | undefined =>
  (typeof process !== 'undefined' ? process.env[name] : undefined) || (import.meta.env as Record<string, string>)[name];

// Vercel's Upstash integration may name the variables either way.
const REDIS_URL = env('KV_REST_API_URL') || env('UPSTASH_REDIS_REST_URL');
const REDIS_TOKEN = env('KV_REST_API_TOKEN') || env('UPSTASH_REDIS_REST_TOKEN');
const SALT = env('LIKES_SALT') || env('KEYSTATIC_SECRET') || REDIS_TOKEN || '';

export const redisEnabled = Boolean(REDIS_URL && REDIS_TOKEN);

export async function redis(commands: (string | number)[][]): Promise<unknown[]> {
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  const results = (await res.json()) as { result?: unknown; error?: string }[];
  const failed = results.find((r) => r.error);
  if (failed) throw new Error(`Redis: ${failed.error}`);
  return results.map((r) => r.result);
}

/** Salted SHA-256, shortened. Used so raw IPs and cookie ids are never stored. */
export async function hashId(...parts: string[]): Promise<string> {
  const data = new TextEncoder().encode([SALT, ...parts].join('|'));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest).slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}

export const ipOf = (request: Request, clientAddress: string) =>
  request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || 'unknown';

/** True once an IP has made more than `limit` requests in `seconds` for this kind of action. */
export async function rateLimited(kind: string, ip: string, limit: number, seconds: number): Promise<boolean> {
  const bucket = `${kind}:rate:${await hashId(ip)}`;
  const [hits] = await redis([
    ['INCR', bucket],
    ['EXPIRE', bucket, seconds, 'NX'],
  ]);
  return Number(hits) > limit;
}

// Each browser gets a random anonymous id in a cookie, so people sharing a network
// (same IP) still count separately. Only a hash of it is ever stored.
const READER_COOKIE = 'reader';
export async function readerId(cookies: AstroCookies): Promise<string> {
  let id = cookies.get(READER_COOKIE)?.value;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    id = crypto.randomUUID();
    cookies.set(READER_COOKIE, id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: import.meta.env.PROD,
      maxAge: 60 * 60 * 24 * 365 * 2,
    });
  }
  return hashId(id, '');
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
