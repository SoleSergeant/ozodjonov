// Builds public/wall.webp: the blurred poster wall behind the landing page, as one small
// image (instead of the browser downloading 24 posters and blurring them live).
// Runs before every build; only redraws when the latest posters change.
// With --optional (used by the build), a network problem never fails the build.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { fromDiaryFile, posterKey } from '../src/data/poster-key.js';

const root = new URL('../', import.meta.url);
const OUT = new URL('public/wall.webp', root);
const STAMP = new URL('public/wall.json', root);
const optional = process.argv.includes('--optional');
const COLS = 8, ROWS = 4, TW = 200, TH = 300;

// Same order as the site: newest year first, first watch of each title, posters only.
const posters = JSON.parse(await readFile(new URL('src/data/posters.json', root), 'utf8'));
const diaryDir = new URL('src/content/diary/', root);
const years = (await readdir(diaryDir)).filter((f) => f.endsWith('.json')).sort().reverse();
const seen = new Set();
const sources = [];
for (const file of years) {
  const { films } = JSON.parse(await readFile(new URL(file, diaryDir), 'utf8'));
  for (const film of films.map(fromDiaryFile)) {
    if (film.tv || seen.has(film.title)) continue;
    seen.add(film.title);
    const src = film.poster ?? (posters[posterKey(film)] ? `https://image.tmdb.org/t/p/w185${posters[posterKey(film)]}` : null);
    if (src) sources.push(src);
    if (sources.length === COLS * ROWS) break;
  }
  if (sources.length === COLS * ROWS) break;
}

const hash = createHash('sha1').update(sources.join('\n')).digest('hex').slice(0, 12);
const previous = existsSync(STAMP) ? JSON.parse(await readFile(STAMP, 'utf8')).hash : null;
if (previous === hash && existsSync(OUT)) {
  console.log('[wall] Up to date.');
  process.exit(0);
}

try {
  const tiles = await Promise.all(
    sources.map(async (src, i) => {
      const buf = src.startsWith('http')
        ? Buffer.from(await (await fetch(src)).arrayBuffer())
        : await readFile(new URL(`public${src}`, root));
      return {
        input: await sharp(buf).resize(TW, TH, { fit: 'cover' }).toBuffer(),
        left: (i % COLS) * TW,
        top: Math.floor(i / COLS) * TH,
      };
    }),
  );
  const grid = await sharp({ create: { width: COLS * TW, height: ROWS * TH, channels: 3, background: '#0b0b0b' } })
    .composite(tiles)
    .png()
    .toBuffer();
  // Blur heavily and shrink: detail is invisible behind the blur anyway.
  await sharp(grid).blur(12).resize(960).webp({ quality: 60 }).toFile(OUT.pathname.replace(/^\/(\w:)/, '$1'));
  await writeFile(STAMP, JSON.stringify({ hash, posters: sources.length }) + '\n');
  console.log(`[wall] Drew public/wall.webp from ${sources.length} posters.`);
} catch (err) {
  console.warn(`[wall] Couldn't redraw the poster wall: ${err.message}`);
  if (!optional) process.exitCode = 1;
}
