import { allowedArticleSlugs } from '../../src/generated/allowed-article-slugs.js';
import { popularArticles } from '../lib/popular.js';

export const onRequestGet: PagesFunction = (context) => popularArticles(context, allowedArticleSlugs);

interface PagesFunction {
  (context: { request: Request; env: { POPULAR_DB?: import('../lib/popular.js').D1Database } }): Promise<Response>;
}
