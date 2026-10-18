import { isAllowedArticleSlug, parsePopularQuery } from './popular-api.js';

export interface PopularDatabase {
  query<T extends Record<string, unknown>>(statement: string, parameters: unknown[]): Promise<T[]>;
}

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

export async function articleView(
  request: Request,
  allowedSlugs: ReadonlySet<string>,
  database: PopularDatabase | null,
): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed('POST');
  if (!originIsValid(request) || !database) return unavailable();

  try {
    const body = (await request.json()) as { slug?: unknown };
    if (!isAllowedArticleSlug(body.slug, allowedSlugs)) return new Response(null, { status: 400 });
    await database.query(
      `INSERT INTO article_views_daily (slug, view_date, view_count)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (slug, view_date)
       DO UPDATE SET view_count = article_views_daily.view_count + 1`,
      [body.slug],
    );
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  } catch {
    return unavailable();
  }
}

export async function popularArticles(
  request: Request,
  allowedSlugs: ReadonlySet<string>,
  database: PopularDatabase | null,
): Promise<Response> {
  if (request.method !== 'GET') return methodNotAllowed('GET');
  if (!originIsValid(request) || !database) return unavailable();

  try {
    const { days, limit } = parsePopularQuery(new URL(request.url).searchParams);
    const rows = await database.query<{ slug: string; views: number | string }>(
      `SELECT slug, SUM(view_count) AS views
       FROM article_views_daily
       WHERE view_date >= CURRENT_DATE - ($1::integer - 1)
       GROUP BY slug
       ORDER BY views DESC, slug ASC
       LIMIT $2`,
      [days, limit],
    );
    const filtered = rows
      .filter((row) => isAllowedArticleSlug(row.slug, allowedSlugs))
      .map((row) => ({ slug: row.slug, views: Number(row.views) }))
      .filter((row) => Number.isSafeInteger(row.views) && row.views >= 0);
    return Response.json(filtered, { headers: { 'cache-control': 'private, max-age=60' } });
  } catch {
    return unavailable();
  }
}
