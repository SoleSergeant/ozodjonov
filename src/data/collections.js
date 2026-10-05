// Box sets, read from src/content/collections/*.json. Sorted by their `order` number.
const files = import.meta.glob('../content/collections/*.json', { eager: true, import: 'default' });

export const collections = Object.entries(files)
  .map(([path, c]) => ({
    ...c,
    slug: path.match(/([^/]+)\.json$/)[1],
    auto: c.allUzbek ? 'uz' : undefined,
  }))
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
