// Poster lookup key, shared by the site and scripts/fetch-posters.mjs.
export const posterKey = (film) => `${film.tv ? 'tv' : 'movie'}|${film.q || film.title}|${film.ry ?? ''}`;

// Diary file entry (as edited in the admin) -> the short shape the site uses.
export const fromDiaryFile = (f) => ({
  title: f.title,
  ry: f.released ?? null,
  q: f.search || undefined,
  rw: !!f.rewatch,
  uz: !!f.uzbek,
  tv: !!f.series,
  post: f.reflection || undefined,
});
