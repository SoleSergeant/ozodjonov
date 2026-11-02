// Link preview images: /og/home.png, /og/blog.png, /og/movies.png, /og/suggest.png, /og/cv.png
// and /og/blog/<post>.png. Base.astro picks the right one for each page.
import type { APIRoute } from 'astro';
import { card, DIM, RED, type Line } from '../../lib/og';
import { excerpt, getPosts } from '../../lib/posts';
import { formatDate, runtime } from '../../lib/films.js';
import { allEntries } from '../../data/movies.js';
import { actors } from '../../data/people.js';
import { site } from '../../data/site.js';
import cv from '../../content/cv.json';

export async function getStaticPaths() {
  const posts = await getPosts();
  return [
    ...['home', 'blog', 'movies', 'suggest', 'cv'].map((kind) => ({ params: { card: kind }, props: { kind } })),
    ...posts.map((post, i) => ({ params: { card: `blog/${post.id}` }, props: { kind: 'post', post, scene: posts.length - i } })),
  ];
}

// The usual layout: a small heading, a big title, then a line or two.
const page = (kicker: string, title: string, ...rest: Line[]): Line[] => [
  { text: kicker, size: 26, color: DIM },
  { text: title, size: 66, bold: true, gap: 34 },
  ...rest,
];

export const GET: APIRoute = async ({ props }) => {
  const { kind, post, scene } = props as { kind: string; post?: any; scene?: number };
  let png: Buffer;
  if (kind === 'post') {
    png = await card({
      page: `${scene}.`,
      footer: `${site.fullName.toUpperCase()} · BLOG`,
      lines: [
        { text: `SCENE ${scene} · ${formatDate(post.data.date)} · ${runtime(post.body ?? '')} MIN`, size: 26, color: DIM },
        { text: post.data.title.toUpperCase(), size: 60, bold: true, gap: 34 },
        { text: excerpt(post, 140), size: 30, color: DIM, gap: 30 },
      ],
    });
  } else if (kind === 'blog') {
    png = await card({
      footer: 'BLOG.OZODJONOV.COM',
      lines: page("INT. THE WRITER'S ROOM — DAY", 'THINKING OUT LOUD.', {
        text: `Essays by ${site.fullName}. Every post is a scene.`,
        size: 30,
        color: DIM,
        gap: 30,
      }),
    });
  } else if (kind === 'movies') {
    png = await card({
      footer: 'MOVIE.OZODJONOV.COM',
      lines: page(
        'CUT TO: INT. CINEMA — EVERY NIGHT SINCE 2024',
        'THE FILM DIARY',
        { text: `${allEntries.length} titles · ${allEntries.filter((f) => f.rw).length} rewatches`, size: 34, gap: 32 },
        { text: actors.map((a) => a.name.split(' ').slice(1).join(' ')).join(', ') + '.', size: 30, color: DIM, gap: 18 },
      ),
    });
  } else if (kind === 'suggest') {
    png = await card({
      footer: 'MOVIE.OZODJONOV.COM/SUGGEST',
      lines: page(
        'EXT. YOUR SIDE OF THE SCREEN',
        'LEAVE A MOVIE',
        { text: 'What should I watch next?', size: 34, gap: 32 },
        { text: "One title. One line why. That's it.", size: 30, color: DIM, gap: 18 },
      ),
    });
  } else if (kind === 'cv') {
    png = await card({
      footer: 'CV.OZODJONOV.COM',
      lines: page(
        'CURRICULUM VITAE',
        site.fullName.toUpperCase(),
        { text: cv.headline, size: 32, color: RED, gap: 32 },
        { text: cv.location ?? '', size: 30, color: DIM, gap: 18 },
      ),
    });
  } else {
    png = await card({
      page: '1.',
      centred: true,
      footer: 'FADE IN:',
      lines: [
        { text: 'OZODJONOV', size: 76, bold: true },
        { text: 'an ongoing screenplay', size: 30, color: DIM, gap: 30 },
        { text: 'written by', size: 28, color: DIM, gap: 56 },
        { text: site.fullName, size: 38, gap: 12 },
      ],
    });
  }
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
