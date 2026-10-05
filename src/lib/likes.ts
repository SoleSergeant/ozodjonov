// Like counts for blog posts, stored in Upstash Redis (added through Vercel → Storage).
// Each post has a set of anonymous visitor ids; the like count is the size of the set.
// Visitor ids are a salted hash of IP + browser, so no IP addresses are stored.

const env = (name: string): string | undefined =>
  (typeof process !== 'undefined' ? process.env[name] : undefined) || (import.meta.env as Record<string, string>)[name];

// Vercel's Upstash integration may name the variables either way.
const REDIS_URL = env('KV_REST_API_URL') || env('UPSTASH_REDIS_REST_URL');
const REDIS_TOKEN = env('KV_REST_API_TOKEN') || env('UPSTASH_REDIS_REST_TOKEN');
const SALT = env('LIKES_SALT') || env('KEYSTATIC_SECRET') || REDIS_TOKEN || '';

export const likesEnabled = Boolean(REDIS_URL && REDIS_TOKEN);

async function redis(commands: (string | number)[][]): Promise<unknown[]> {
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

export async function visitorId(ip: string, userAgent: string): Promise<string> {
  const data = new TextEncoder().encode(`${SALT}|${ip}|${userAgent}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest).slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}

const key = (slug: string) => `likes:post:${slug}`;

// At most `limit` like clicks per minute from one IP (hashed), to stop scripted spam.
export async function rateLimited(ip: string, limit = 20): Promise<boolean> {
  const bucket = `likes:rate:${await visitorId(ip, '')}`;
  const [hits] = await redis([
    ['INCR', bucket],
    ['EXPIRE', bucket, 60, 'NX'],
  ]);
  return Number(hits) > limit;
}

export async function getLikes(slug: string, visitor: string) {
  const [count, liked] = await redis([
    ['SCARD', key(slug)],
    ['SISMEMBER', key(slug), visitor],
  ]);
  return { count: Number(count), liked: Number(liked) === 1 };
}

export async function toggleLike(slug: string, visitor: string) {
  const { liked } = await getLikes(slug, visitor);
  const [, count] = await redis([
    [liked ? 'SREM' : 'SADD', key(slug), visitor],
    ['SCARD', key(slug)],
  ]);
  return { count: Number(count), liked: !liked };
}
