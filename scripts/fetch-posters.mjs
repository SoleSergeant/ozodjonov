// Looks up a poster for every diary entry on TMDB and saves the paths to
// src/data/posters.json. Runs before every build; run `npm run posters` by hand too.
// Needs TMDB_API_KEY or TMDB_TOKEN in .env locally, or in Vercel's environment variables.
// With --optional (used by the build), a missing key or TMDB outage never fails the build.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fromDiaryFile, posterKey } from '../src/data/poster-key.js';

const OUT = new URL('../src/data/posters.json', import.meta.url);
const DIARY = new URL('../src/content/diary/', import.meta.url);
const optional = process.argv.includes('--optional');
const { TMDB_API_KEY, TMDB_TOKEN } = process.env;

if (!TMDB_API_KEY && !TMDB_TOKEN) {
  console.log('[posters] No TMDB key set, skipping poster lookup.');
  process.exit(optional ? 0 : 1);
}

const films = [];
for (const file of (await readdir(DIARY)).filter((f) => f.endsWith('.json'))) {
  const { films: list } = JSON.parse(await readFile(new URL(file, DIARY), 'utf8'));
  films.push(...list.map(fromDiaryFile));
}

const posters = JSON.parse(await readFile(OUT, 'utf8'));
const pending = [...new Map(films.map((f) => [posterKey(f), f])).values()].filter(
  (f) => !(posterKey(f) in posters),
);

async function search(film) {
  const kind = film.tv ? 'tv' : 'movie';
  const params = new URLSearchParams({ query: film.q ?? film.title.replace(/\s*\(.*\)$/, '') });
  if (film.ry) params.set(kind === 'tv' ? 'first_air_date_year' : 'year', String(film.ry));
  if (TMDB_API_KEY) params.set('api_key', TMDB_API_KEY);

  const res = await fetch(`https://api.themoviedb.org/3/search/${kind}?${params}`, {
    headers: TMDB_TOKEN ? { Authorization: `Bearer ${TMDB_TOKEN}` } : {},
  });
  if (!res.ok) throw new Error(`TMDB ${res.status} for "${film.title}"`);
  const { results } = await res.json();
  // Uzbek titles often match foreign films with similar names, so only accept Uzbek-language results.
  return results.find((r) => r.poster_path && (!film.uz || r.original_language === 'uz'))?.poster_path ?? null;
}

let found = 0;
const missing = [];
try {
  for (const film of pending) {
    const path = await search(film);
    if (path) {
      posters[posterKey(film)] = path;
      found++;
    } else {
      missing.push(film.title);
    }
  }
} catch (err) {
  console.warn(`[posters] Stopped early: ${err.message}`);
  if (!optional) process.exitCode = 1;
}

await writeFile(OUT, JSON.stringify(posters, null, 2) + '\n');
console.log(`[posters] Found ${found} new posters (${Object.keys(posters).length} total).`);
if (missing.length) {
  console.log(`[posters] No poster for ${missing.length} titles (they'll use a title card):\n  ${missing.join('\n  ')}`);
}
