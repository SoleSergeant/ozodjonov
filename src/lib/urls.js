// The site lives on four addresses, all served by this one project:
//   www.ozodjonov.com    landing page, contact, admin
//   blog.ozodjonov.com   blog          (files under /blog)
//   movie.ozodjonov.com  film diary    (files under /movies and /collections)
//   cv.ozodjonov.com     CV            (files under /cv)
// scripts/subdomain-routes.mjs teaches Vercel which address shows which files.
// While developing locally there are no subdomains, so links use the plain file paths.

export const hosts = {
  main: 'https://www.ozodjonov.com',
  blog: 'https://blog.ozodjonov.com',
  movie: 'https://movie.ozodjonov.com',
  cv: 'https://cv.ozodjonov.com',
};

// Local file path for a path on each address.
function localPath(section, path) {
  if (section === 'blog') return '/blog' + (path === '/' ? '' : path);
  if (section === 'cv') return '/cv' + (path === '/' ? '' : path);
  if (section === 'movie') {
    if (path.startsWith('/collections')) return path;
    return '/movies' + (path === '/' ? '' : path);
  }
  return path;
}

export const url = (section, path = '/') =>
  import.meta.env.PROD ? hosts[section] + path : localPath(section, path);

// The public address of a page from its file path, e.g. /blog/beginning -> https://blog.ozodjonov.com/beginning.
export function publicUrl(filePath) {
  if (filePath.startsWith('/blog')) return hosts.blog + (filePath.slice(5) || '/');
  if (filePath.startsWith('/movies')) return hosts.movie + (filePath.slice(7) || '/');
  if (filePath.startsWith('/collections')) return hosts.movie + filePath;
  if (filePath.startsWith('/cv')) return hosts.cv + (filePath.slice(3) || '/');
  return hosts.main + filePath;
}
