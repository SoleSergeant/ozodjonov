// RSS feed of the blog, at blog.ozodjonov.com/rss.xml (files with an extension are served
// on every address, see scripts/subdomain-routes.mjs).
import { getPosts } from '../lib/posts';
import { site } from '../data/site.js';
import { hosts } from '../lib/urls.js';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET() {
  const items = (await getPosts()).map((p) => {
    const link = `${hosts.blog}/${p.id}`;
    return `<item><title>${esc(p.data.title)}</title><link>${link}</link><guid>${link}</guid><pubDate>${p.data.date.toUTCString()}</pubDate>${
      p.data.description ? `<description>${esc(p.data.description)}</description>` : ''
    }</item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>${esc(site.fullName)}</title><link>${hosts.blog}/</link><description>${esc(site.intro ?? site.tagline)}</description><language>en</language>
${items.join('\n')}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
