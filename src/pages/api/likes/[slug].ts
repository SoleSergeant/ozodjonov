import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getLikes, toggleLike } from '../../../lib/likes';
import { ipOf, json, rateLimited, readerId, redisEnabled } from '../../../lib/server';

// Runs on the server (Vercel), not at build time.
export const prerender = false;

// Only real, published posts can be liked.
async function isPost(slug: string | undefined) {
  if (!slug || !/^[a-z0-9-]{1,100}$/.test(slug)) return false;
  const posts = await getCollection('blog', ({ data }) => !data.draft || import.meta.env.DEV);
  return posts.some((p) => p.id === slug);
}

export const GET: APIRoute = async ({ params, cookies }) => {
  if (!redisEnabled) return json({ error: 'Likes are not set up yet.' }, 503);
  if (!(await isPost(params.slug))) return json({ error: 'Not found' }, 404);
  try {
    return json(await getLikes(params.slug!, await readerId(cookies)));
  } catch {
    return json({ error: 'Could not load likes.' }, 502);
  }
};

export const POST: APIRoute = async ({ params, request, clientAddress, cookies }) => {
  if (!redisEnabled) return json({ error: 'Likes are not set up yet.' }, 503);
  if (!(await isPost(params.slug))) return json({ error: 'Not found' }, 404);
  try {
    // At most 20 like clicks per minute from one IP, to stop scripted spam.
    if (await rateLimited('likes', ipOf(request, clientAddress), 20, 60)) {
      return json({ error: 'Too many likes. Try again in a minute.' }, 429);
    }
    return json(await toggleLike(params.slug!, await readerId(cookies)));
  } catch {
    return json({ error: 'Could not save your like.' }, 502);
  }
};
