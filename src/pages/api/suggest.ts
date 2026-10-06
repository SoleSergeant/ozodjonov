import type { APIRoute } from 'astro';
import { ipOf, json, rateLimited, readerId, redisEnabled } from '../../lib/server';
import { addSuggestion, inDiary, searchFilms, textPick, tmdbEnabled, verifyPick } from '../../lib/suggestions';

// Runs on the server (Vercel), not at build time.
export const prerender = false;

const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';

/** GET /api/suggest?q=godfa  ->  matching films from TMDB, for the type-ahead list. */
export const GET: APIRoute = async ({ url, request, clientAddress }) => {
  const q = clean(url.searchParams.get('q'), 80);
  if (q.length < 2) return json({ results: [] });
  if (!tmdbEnabled) return json({ results: [] });
  try {
    if (redisEnabled && (await rateLimited('tmdb', ipOf(request, clientAddress), 90, 60))) {
      return json({ error: 'Slow down a little.' }, 429);
    }
    const results = (await searchFilms(q)).map((r) => ({ ...r, seen: inDiary(r.title, r.year) }));
    return json({ results }, 200, { 'Cache-Control': 'public, max-age=3600' });
  } catch {
    return json({ results: [] });
  }
};

/** POST /api/suggest  { id?, title?, note?, name?, website? }  ->  save a suggestion. */
export const POST: APIRoute = async ({ request, clientAddress, cookies }) => {
  if (!redisEnabled) return json({ error: 'Suggestions are not set up yet.' }, 503);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'That didn’t look right. Try again.' }, 400);
  }

  // Honeypot: a field people never see. Bots fill it in; pretend it worked.
  if (clean(body.website, 200)) return json({ status: 'added', count: 1 });

  const note = clean(body.note, 280);
  const name = clean(body.name, 40);
  const id = clean(body.id, 20);
  const typed = clean(body.title, 120);

  const pick = id ? await verifyPick(id) : typed.length >= 2 ? textPick(typed) : null;
  if (!pick) return json({ error: 'Pick a film from the list, or type its full title.' }, 400);
  if (inDiary(pick.title, pick.year)) return json({ status: 'seen', title: pick.title });

  try {
    // At most 6 suggestions per 10 minutes from one IP.
    if (await rateLimited('suggest', ipOf(request, clientAddress), 6, 600)) {
      return json({ error: 'That’s a lot of suggestions. Try again in a few minutes.' }, 429);
    }
    const { count, alreadySuggested } = await addSuggestion(pick, await readerId(cookies), note, name);
    return json({ status: alreadySuggested ? 'again' : 'added', title: pick.title, count });
  } catch {
    return json({ error: 'Couldn’t save that. Try again in a moment.' }, 502);
  }
};
