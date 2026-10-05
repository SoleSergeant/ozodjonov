// The site lives on three addresses, all served by this one project:
//   www.ozodjonov.com    landing page, contact, admin
//   blog.ozodjonov.com   blog          (files under /blog)
//   movie.ozodjonov.com  film diary    (files under /movies and /collections)
// scripts/subdomain-routes.mjs teaches Vercel which address shows which files.
// While developing locally there are no subdomains, so links use the plain file paths.

export const hosts = {
  main: 'https://www.ozodjonov.com',
  blog: 'https://blog.ozodjonov.com',
  movie: 'https://movie.ozodjonov.com',
};

// Local file path for a path on each address.
function localPath(section, path) {
  if (section === 'blog') return '/blog' + (path === '/' ? '' : path);
  if (section === 'movie') {
    if (path.startsWith('/collections')) return path;
    return '/movies' + (path === '/' ? '' : path);
  }
  return path;
}

export const url = (section, path = '/') =>
  import.meta.env.PROD ? hosts[section] + path : localPath(section, path);
