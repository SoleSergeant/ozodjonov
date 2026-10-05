// The film diary, read from src/content/diary/<year>.json (edited in the admin at /keystatic).
import { fromDiaryFile } from './poster-key.js';
export { posterKey } from './poster-key.js';

const files = import.meta.glob('../content/diary/*.json', { eager: true, import: 'default' });

export const diary = Object.fromEntries(
  Object.entries(files).map(([path, data]) => [
    Number(path.match(/(\d{4})\.json$/)[1]),
    data.films.map(fromDiaryFile),
  ]),
);

export const years = Object.keys(diary).map(Number).sort((a, b) => b - a);

// Every diary entry, newest year first, with its watch year attached.
export const allEntries = years.flatMap((year) =>
  diary[year].map((film, i) => ({ ...film, year, order: i })),
);
