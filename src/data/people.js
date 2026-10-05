// The leading men, read from src/content/actors/*.json.
const files = import.meta.glob('../content/actors/*.json', { eager: true, import: 'default' });

const initials = (name) => name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

export const actors = Object.entries(files)
  .map(([path, a]) => ({
    ...a,
    slug: path.match(/([^/]+)\.json$/)[1],
    initials: initials(a.name),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
