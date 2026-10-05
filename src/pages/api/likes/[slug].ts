import type { APIRoute, AstroCookies } from 'astro';
import { getCollection } from 'astro:content';
import { getLikes, likesEnabled, rateLimited, toggleLike, visitorId } from '../../../lib/likes';

// Runs on the server (Vercel), not at build time.
export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

// Only real, published posts can be liked.
async function isPost(slug: string | undefined) {
  if (!slug || !/^[a-z0-9-]{1,100}$/.test(slug)) return false;
  const posts = await getCollection('blog', ({ data }) => !data.draft || import.meta.env.DEV);
  return posts.some((p) => p.id === slug);
}

const ipOf = (request: Request, clientAddress: string) =>
  request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || 'unknown';

// Each browser gets a random anonymous id in a cookie, so people sharing a network
// (same IP) still count separately. The id itself is hashed before it's stored.
const COOKIE = 'reader';
function visitor(cookies: AstroCookies) {
  let id = cookies.get(COOKIE)?.value;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    id = crypto.randomUUID();
    cookies.set(COOKIE, id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: import.meta.env.PROD,
      maxAge: 60 * 60 * 24 * 365 * 2,
    });
  }
  return visitorId(id, '');
}

export const GET: APIRoute = async ({ params, request, clientAddress, cookies }) => {
  if (!likesEnabled) return json({ error: 'Likes are not set up yet.' }, 503);
  if (!(await isPost(params.slug))) return json({ error: 'Not found' }, 404);
  try {
    return json(await getLikes(params.slug!, await visitor(cookies)));
  } catch {
    return json({ error: 'Could not load likes.' }, 502);
  }
};

export const POST: APIRoute = async ({ params, request, clientAddress, cookies }) => {
  if (!likesEnabled) return json({ error: 'Likes are not set up yet.' }, 503);
  if (!(await isPost(params.slug))) return json({ error: 'Not found' }, 404);
  try {
    if (await rateLimited(ipOf(request, clientAddress))) return json({ error: 'Too many likes. Try again in a minute.' }, 429);
    return json(await toggleLike(params.slug!, await visitor(cookies)));
  } catch {
    return json({ error: 'Could not save your like.' }, 502);
  }
};
