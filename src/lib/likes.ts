// Like counts for blog posts. Each post has a set of anonymous reader ids (see readerId
// in ./server); the like count is the size of the set.
import { redis } from './server';

const key = (slug: string) => `likes:post:${slug}`;

export async function getLikes(slug: string, reader: string) {
  const [count, liked] = await redis([
    ['SCARD', key(slug)],
    ['SISMEMBER', key(slug), reader],
  ]);
  return { count: Number(count), liked: Number(liked) === 1 };
}

export async function toggleLike(slug: string, reader: string) {
  const { liked } = await getLikes(slug, reader);
  const [, count] = await redis([
    [liked ? 'SREM' : 'SADD', key(slug), reader],
    ['SCARD', key(slug)],
  ]);
  return { count: Number(count), liked: !liked };
}
