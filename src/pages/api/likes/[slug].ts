import type { APIRoute } from 'astro';
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

const visitor = (request: Request, clientAddress: string) =>
  visitorId(ipOf(request, clientAddress), request.headers.get('user-agent') ?? '');

export const GET: APIRoute = async ({ params, request, clientAddress }) => {
  if (!likesEnabled) return json({ error: 'Likes are not set up yet.' }, 503);
  if (!(await isPost(params.slug))) return json({ error: 'Not found' }, 404);
  try {
    return json(await getLikes(params.slug!, await visitor(request, clientAddress)));
  } catch {
    return json({ error: 'Could not load likes.' }, 502);
  }
};

export const POST: APIRoute = async ({ params, request, clientAddress }) => {
  if (!likesEnabled) return json({ error: 'Likes are not set up yet.' }, 503);
  if (!(await isPost(params.slug))) return json({ error: 'Not found' }, 404);
  try {
    if (await rateLimited(ipOf(request, clientAddress))) return json({ error: 'Too many likes. Try again in a minute.' }, 429);
    return json(await toggleLike(params.slug!, await visitor(request, clientAddress)));
  } catch {
    return json({ error: 'Could not save your like.' }, 502);
  }
};
