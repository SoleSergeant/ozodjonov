import { allEntries, posterKey } from '../data/movies.js';
import { collections } from '../data/collections.js';
import posters from '../data/posters.json';

const IMG = 'https://image.tmdb.org/t/p/w342';

export const posterUrl = (film) => {
  const path = posters[posterKey(film)];
  return path ? IMG + path : null;
};

// Fallback "title card" color, picked from the title so it stays stable.
const hues = ['#1d2a3a', '#3a2a1d', '#2a1d2f', '#1d3a2f', '#2f2a20', '#33201d', '#202c33', '#2b2a1e', '#1f1c26', '#2d2219'];
export const cardColor = (title) => hues[[...title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % hues.length];

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
