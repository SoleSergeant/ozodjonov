import { allEntries, posterKey } from '../data/movies.js';
import { collections } from '../data/collections.js';
import posters from '../data/posters.json';

const IMG = 'https://image.tmdb.org/t/p/w342';

export const posterUrl = (film) => {
  if (film.poster) return film.poster; // uploaded in the admin
  const path = posters[posterKey(film)];
  return path ? IMG + path : null;
};

export const photoUrl = (name) => {
  const path = posters[`person|${name}`];
  return path ? 'https://image.tmdb.org/t/p/w185' + path : null;
};

// Fallback "title card" color for missing posters: a faint tint of the page's own card color,
// picked from the title so it stays stable and works on both paper and dark.
const hues = ['#1d4a7a', '#7a4a1d', '#5a1d6f', '#1d6a4f', '#6f5a20', '#83301d', '#20607a', '#5b5a1e', '#3f2c66', '#7d4219'];
export const cardColor = (title) =>
  `color-mix(in srgb, ${hues[[...title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % hues.length]} 14%, var(--color-reel))`;

// One entry per title (the most recent watch), keeping first-watch order otherwise.
export const uniqueFilms = (() => {
  const seen = new Map();
  for (const film of allEntries) {
    const prev = seen.get(film.title);
    if (!prev) seen.set(film.title, { ...film, watches: [film.year] });
    else prev.watches.push(film.year);
  }
  return [...seen.values()];
})();

const byTitle = new Map(uniqueFilms.map((f) => [f.title, f]));

// Titles typed in the admin that don't match the diary are skipped (with a warning)
// rather than failing the whole site build.
export function findFilms(titles, where) {
  return titles.flatMap((title) => {
    const film = byTitle.get(title);
    if (!film) {
      console.warn(`[films] "${title}" in ${where} is not in the film diary — check the spelling.`);
      return [];
    }
    return [film];
  });
}

export function collectionFilms(c) {
  if (c.auto === 'uz') return uniqueFilms.filter((f) => f.uz);
  return findFilms(c.films, `collection "${c.slug}"`);
}

export const resolvedCollections = collections.map((c) => ({ ...c, items: collectionFilms(c) }));

export const runtime = (text) => Math.max(1, Math.round(text.split(/\s+/).length / 200));

export const formatDate = (date) =>
  date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase();
