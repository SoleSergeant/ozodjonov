// Link preview cards (1200x630), drawn at build time as a page of a screenplay.
// Text is set in Courier Prime from src/assets/fonts, so it looks the same on Vercel as locally.
import sharp from 'sharp';
import path from 'node:path';

const FONTS = path.join(process.cwd(), 'src/assets/fonts');
const REGULAR = path.join(FONTS, 'CourierPrime-Regular.ttf');
const BOLD = path.join(FONTS, 'CourierPrime-Bold.ttf');
export const INK = '#161513', DIM = '#5c574f', RED = '#a3261b';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export type Line = { text: string; size: number; bold?: boolean; color?: string; gap?: number };

async function setText({ text, size, bold, color = INK }: Line, width: number, align: 'left' | 'centre' = 'left') {
  return sharp({
    text: {
      text: `<span foreground="${color}">${esc(text)}</span>`,
      font: `Courier Prime ${bold ? 'Bold ' : ''}${size}`,
      fontfile: bold ? BOLD : REGULAR,
      width,
      align,
      dpi: 72,
      rgba: true,
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
}

/** A script page: lines stacked from the top, an optional page number, and a footer. */
export async function card(opts: { lines: Line[]; footer: string; page?: string; centred?: boolean }) {
  const { lines, footer, page, centred = false } = opts;
  const X = 210, W = 780;
  const layers: sharp.OverlayOptions[] = [];
  // Set every line first, then centre the block in the space above the footer.
  const set = await Promise.all(lines.map((line) => setText(line, W, centred ? 'centre' : 'left')));
  const total = set.reduce((h, { info }, i) => h + info.height + (lines[i].gap ?? 0), 0);
  let y = Math.max(80, Math.round(285 - total / 2));
  set.forEach(({ data, info }, i) => {
    y += lines[i].gap ?? 0;
    layers.push({ input: data, left: centred ? Math.round(600 - info.width / 2) : X, top: y });
    y += info.height;
  });
  const foot = await setText({ text: footer, size: 22, color: DIM }, 560);
  const site = await setText({ text: 'ozodjonov.com', size: 22, color: RED }, 260);
  layers.push({ input: foot.data, left: X, top: 560 });
  layers.push({ input: site.data, left: 990 - site.info.width, top: 560 });
  if (page) {
    const p = await setText({ text: page, size: 22, color: DIM }, 120);
    layers.push({ input: p.data, left: 1000 - p.info.width, top: 44 });
  }
  const paper = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="#e9e5db"/>
    <rect x="150" y="-2" width="900" height="634" fill="#f7f5ef" stroke="#dcd7cc" stroke-width="2"/></svg>`;
  return sharp(Buffer.from(paper)).composite(layers).png({ compressionLevel: 9 }).toBuffer();
}
