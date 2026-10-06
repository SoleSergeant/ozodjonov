// Film suggestions from visitors, stored in Upstash Redis:
//   suggest:index          sorted set of film ids, scored by latest suggestion time
//   suggest:film:<id>      hash: title, year, poster, kind, first, last
//   suggest:voters:<id>    set of reader hashes who suggested it (the count)
//   suggest:notes:<id>     list of JSON notes { note, name, at }, newest first
import { env, redis } from './server';
import { uniqueFilms } from './films.js';

export type FilmPick = { id: string; kind: 'movie' | 'tv' | 'text'; title: string; year: string; poster: string | null };

const TMDB_KEY = env('TMDB_API_KEY');
const TMDB_TOKEN = env('TMDB_TOKEN');
export const tmdbEnabled = Boolean(TMDB_KEY || TMDB_TOKEN);

async function tmdb(path: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params);
  if (TMDB_KEY) qs.set('api_key', TMDB_KEY);
  const res = await fetch(`https://api.themoviedb.org/3${path}?${qs}`, {
    headers: TMDB_TOKEN ? { Authorization: `Bearer ${TMDB_TOKEN}` } : {},
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

const toPick = (r: any, kind: 'movie' | 'tv'): FilmPick => ({
  id: `${kind}-${r.id}`,
  kind,
  title: kind === 'tv' ? r.name : r.title,
  year: String((kind === 'tv' ? r.first_air_date : r.release_date) ?? '').slice(0, 4),
  poster: r.poster_path ? `https://image.tmdb.org/t/p/w185${r.poster_path}` : null,
});

export async function searchFilms(query: string): Promise<FilmPick[]> {
  const { results } = await tmdb('/search/multi', { query, include_adult: 'false' });
  return (results as any[])
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 6)
    .map((r) => toPick(r, r.media_type));
}

/** Look a pick up again on the server, so we never trust a title or poster sent by the browser. */
export async function verifyPick(id: string): Promise<FilmPick | null> {
  const m = /^(movie|tv)-(\d{1,9})$/.exec(id);
  if (!m) return null;
  try {
    return toPick(await tmdb(`/${m[1]}/${m[2]}`), m[1] as 'movie' | 'tv');
  } catch {
    return null;
  }
}

export const textPick = (title: string): FilmPick => ({
  id: `text-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'untitled'}`,
  kind: 'text',
  title,
  year: '',
  poster: null,
});

// Is this already in the diary? Compare titles loosely (case, accents, punctuation).
const fold = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\(.*\)/g, '').replace(/[^a-z0-9]+/g, '');
// Same title from a different year (e.g. Parasite 1982 vs 2019) doesn't count, when both years are known.
const diaryYears = new Map<string, (number | null)[]>();
for (const f of uniqueFilms as any[]) {
  for (const t of [f.title, f.q].filter(Boolean)) diaryYears.set(fold(t), [...(diaryYears.get(fold(t)) ?? []), f.ry ?? null]);
}
export const inDiary = (title: string, year = '') => {
  const years = diaryYears.get(fold(title));
  if (!years) return false;
  const y = Number(year);
  return !y || years.some((ry) => ry === null || Math.abs(ry - y) <= 1);
};

export async function addSuggestion(pick: FilmPick, reader: string, note: string, name: string) {
  const now = Date.now();
  const k = (part: string) => `suggest:${part}:${pick.id}`;
  const commands: (string | number)[][] = [
    ['HSETNX', k('film'), 'first', now],
    ['HSET', k('film'), 'title', pick.title, 'year', pick.year, 'poster', pick.poster ?? '', 'kind', pick.kind, 'last', now],
    ['SADD', k('voters'), reader],
    ['ZADD', 'suggest:index', now, pick.id],
  ];
  if (note || name) {
    commands.push(['LPUSH', k('notes'), JSON.stringify({ note, name, at: now })], ['LTRIM', k('notes'), 0, 49]);
  }
  commands.push(['SCARD', k('voters')]);
  const results = await redis(commands);
  return { count: Number(results.at(-1)), alreadySuggested: Number(results[2]) === 0 };
}

export type Suggestion = FilmPick & { count: number; first: number; last: number; notes: { note: string; name: string; at: number }[] };

export async function listSuggestions(limit = 200): Promise<Suggestion[]> {
  const [ids] = (await redis([['ZREVRANGE', 'suggest:index', 0, limit - 1]])) as string[][];
  if (!ids?.length) return [];
  const results = await redis(
    ids.flatMap((id) => [
      ['HGETALL', `suggest:film:${id}`],
      ['SCARD', `suggest:voters:${id}`],
      ['LRANGE', `suggest:notes:${id}`, 0, 49],
    ]),
  );
  return ids.map((id, i) => {
    const flat = (results[i * 3] as string[]) ?? [];
    const h: Record<string, string> = {};
    for (let j = 0; j < flat.length; j += 2) h[flat[j]] = flat[j + 1];
    return {
      id,
      kind: (h.kind as FilmPick['kind']) ?? 'text',
      title: h.title ?? id,
      year: h.year ?? '',
      poster: h.poster || null,
      count: Number(results[i * 3 + 1]),
      first: Number(h.first),
      last: Number(h.last),
      notes: ((results[i * 3 + 2] as string[]) ?? []).map((n) => JSON.parse(n)),
    };
  });
}

export async function deleteSuggestion(id: string) {
  await redis([
    ['DEL', `suggest:film:${id}`, `suggest:voters:${id}`, `suggest:notes:${id}`],
    ['ZREM', 'suggest:index', id],
  ]);
}
