import { allowedArticleSlugs } from '../src/generated/allowed-article-slugs.js';
import { articleView } from '../src/lib/popular-handlers.js';
import { createNeonPopularDatabase } from '../src/lib/neon-popular-db.js';

export async function POST(request: Request): Promise<Response> {
  return articleView(request, allowedArticleSlugs, createNeonPopularDatabase());
}
