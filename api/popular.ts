import { allowedArticleSlugs } from '../src/generated/allowed-article-slugs.js';
import { popularArticles } from '../src/lib/popular-handlers.js';
import { createNeonPopularDatabase } from '../src/lib/neon-popular-db.js';

export async function GET(request: Request): Promise<Response> {
  return popularArticles(request, allowedArticleSlugs, createNeonPopularDatabase());
}
