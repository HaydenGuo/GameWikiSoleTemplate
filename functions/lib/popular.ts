import { isAllowedArticleSlug, parsePopularQuery } from '../../src/lib/popular-api.js';

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface PopularEnv {
  POPULAR_DB?: D1Database;
}

type RequestContext = { request: Request; env: PopularEnv };

function methodNotAllowed(allow: string): Response {
  return new Response(null, { status: 405, headers: { allow } });
}

function originIsValid(request: Request): boolean {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

function unavailable(): Response {
  return new Response(null, { status: 503, headers: { 'cache-control': 'no-store' } });
}

export async function articleView(context: RequestContext, allowedSlugs: ReadonlySet<string>): Promise<Response> {
  const { request, env } = context;
  if (request.method !== 'POST') return methodNotAllowed('POST');
  if (!originIsValid(request) || !env.POPULAR_DB) return unavailable();

  try {
    const body = (await request.json()) as { slug?: unknown };
    if (!isAllowedArticleSlug(body.slug, allowedSlugs)) return new Response(null, { status: 400 });
    await env.POPULAR_DB
      .prepare(
        `INSERT INTO article_views_daily (slug, view_date, view_count)
         VALUES (?, date('now'), 1)
         ON CONFLICT(slug, view_date)
         DO UPDATE SET view_count = article_views_daily.view_count + 1`,
      )
      .bind(body.slug)
      .run();
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  } catch {
    return unavailable();
  }
}

export async function popularArticles(context: RequestContext, allowedSlugs: ReadonlySet<string>): Promise<Response> {
  const { request, env } = context;
  if (request.method !== 'GET') return methodNotAllowed('GET');
  if (!originIsValid(request) || !env.POPULAR_DB) return unavailable();

  try {
    const { days, limit } = parsePopularQuery(new URL(request.url).searchParams);
    const rows = await env.POPULAR_DB
      .prepare(
        `SELECT slug, SUM(view_count) AS views
         FROM article_views_daily
         WHERE view_date >= date('now', ?)
         GROUP BY slug
         ORDER BY views DESC, slug ASC
         LIMIT ?`,
      )
      .bind(`-${Math.max(0, days - 1)} days`, limit)
      .all<{ slug: string; views: number }>();
    const filtered = rows.results.filter((row) => isAllowedArticleSlug(row.slug, allowedSlugs));
    return Response.json(filtered, { headers: { 'cache-control': 'private, max-age=60' } });
  } catch {
    return unavailable();
  }
}
