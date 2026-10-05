// Looks up a poster for every diary entry on TMDB and saves the paths to
// src/data/posters.json. Run with `npm run posters` after adding films.
// Needs TMDB_API_KEY or TMDB_TOKEN in .env (see .env.example).
import { readFile, writeFile } from 'node:fs/promises';
import { allEntries, posterKey } from '../src/data/movies.js';

const OUT = new URL('../src/data/posters.json', import.meta.url);
const { TMDB_API_KEY, TMDB_TOKEN } = process.env;

if (!TMDB_API_KEY && !TMDB_TOKEN) {
  console.error('Add TMDB_API_KEY or TMDB_TOKEN to a .env file first (see .env.example).');
  process.exit(1);
}

const posters = JSON.parse(await readFile(OUT, 'utf8'));
const pending = [...new Map(allEntries.map((f) => [posterKey(f), f])).values()].filter(
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
  return results.find((r) => r.poster_path)?.poster_path ?? null;
}

let found = 0;
const missing = [];
for (const film of pending) {
  const path = await search(film);
  if (path) {
    posters[posterKey(film)] = path;
    found++;
  } else {
    missing.push(film.title);
  }
}

await writeFile(OUT, JSON.stringify(posters, null, 2) + '\n');
console.log(`Found ${found} new posters (${Object.keys(posters).length} total).`);
if (missing.length) {
  console.log(`No poster for ${missing.length} titles (they'll use a title card):\n  ${missing.join('\n  ')}`);
}
