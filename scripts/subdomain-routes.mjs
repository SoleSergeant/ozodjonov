// Runs after `astro build`. Adds host-based rules to Vercel's routing config so
// blog., movie. and cv.ozodjonov.com show their sections, and the old
// www.ozodjonov.com/blog, /movies, /collections links redirect there.
import { readFile, writeFile } from 'node:fs/promises';

const CONFIG = new URL('../.vercel/output/config.json', import.meta.url);
const host = (value) => [{ type: 'host', value }];

// Paths that every address must serve as-is: built assets, files in public/ (logo,
// favicon, uploaded images: anything ending in a file extension), admin, and server routes.
const shared = '_astro/|_image|_server-islands/|images/|keystatic|api/|[^/]+\\.[a-z0-9]+$';

const routes = [
  // Old links on the main domain move to the subdomains.
  ...['www.ozodjonov.com', 'ozodjonov.com'].flatMap((h) => [
    { src: '^/blog(?:/(.*))?$', has: host(h), status: 308, headers: { Location: 'https://blog.ozodjonov.com/$1' } },
    { src: '^/movies(?:/(.*))?$', has: host(h), status: 308, headers: { Location: 'https://movie.ozodjonov.com/$1' } },
    { src: '^/collections(/.*)?$', has: host(h), status: 308, headers: { Location: 'https://movie.ozodjonov.com/collections$1' } },
    { src: '^/cv/?$', has: host(h), status: 308, headers: { Location: 'https://cv.ozodjonov.com/' } },
  ]),

  // blog.ozodjonov.com/<post>  ->  /blog/<post>
  { src: `^/(?!${shared}|blog(?:/|$))(.*)$`, has: host('blog.ozodjonov.com'), dest: '/blog/$1', continue: true },

  // movie.ozodjonov.com/  ->  /movies,  /actors/<name>  ->  /movies/actors/<name>,  /suggest  ->  /movies/suggest
  { src: '^/$', has: host('movie.ozodjonov.com'), dest: '/movies/', continue: true },
  { src: '^/actors/(.*)$', has: host('movie.ozodjonov.com'), dest: '/movies/actors/$1', continue: true },
  { src: '^/suggest/?$', has: host('movie.ozodjonov.com'), dest: '/movies/suggest/', continue: true },

  // cv.ozodjonov.com/  ->  /cv
  { src: '^/$', has: host('cv.ozodjonov.com'), dest: '/cv/', continue: true },
];

const config = JSON.parse(await readFile(CONFIG, 'utf8'));
const fsIndex = config.routes.findIndex((r) => r.handle === 'filesystem');
config.routes.splice(fsIndex, 0, ...routes);
await writeFile(CONFIG, JSON.stringify(config, null, 2));
console.log(`[subdomains] Added ${routes.length} host routes to Vercel config.`);
