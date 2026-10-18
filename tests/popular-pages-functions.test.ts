import { describe, expect, it, vi } from 'vitest';
import { articleView, popularArticles, type PopularDatabase } from '../src/lib/popular-handlers.js';

const allowed = new Set(['/guides/emberfang/']);

function database(rows: Array<{ slug: string; views: number | string }> = [{ slug: '/guides/emberfang/', views: 4 }]): PopularDatabase {
  return { query: vi.fn(async () => rows) as unknown as PopularDatabase['query'] };
}

describe('Vercel Popular API handlers', () => {
  it('returns 503 when the optional Neon database is absent', async () => {
    const response = await articleView(
      new Request('https://example.com/api/article-view', { method: 'POST', body: '{"slug":"/guides/emberfang/"}' }),
      allowed,
      null,
    );
    expect(response.status).toBe(503);
  });

  it('rejects an unknown article slug before touching Postgres', async () => {
    const db = database();
    const response = await articleView(
      new Request('https://example.com/api/article-view', {
        method: 'POST',
        headers: { origin: 'https://example.com', 'content-type': 'application/json' },
        body: '{"slug":"/guides/not-published/"}',
      }),
      allowed,
      db,
    );
    expect(response.status).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('uses parameterized Postgres SQL for a valid view and returns 204', async () => {
    const db = database();
    const response = await articleView(
      new Request('https://example.com/api/article-view', {
        method: 'POST',
        headers: { origin: 'https://example.com', 'content-type': 'application/json' },
        body: '{"slug":"/guides/emberfang/"}',
      }),
      allowed,
      db,
    );
    expect(response.status).toBe(204);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT (slug, view_date)'), ['/guides/emberfang/']);
  });

  it('returns the published-article ranking for a valid GET request', async () => {
    const response = await popularArticles(
      new Request('https://example.com/api/popular?days=7&limit=3'),
      allowed,
      database([{ slug: '/guides/emberfang/', views: '4' }, { slug: '/guides/unpublished/', views: '99' }]),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ slug: '/guides/emberfang/', views: 4 }]);
  });

  it('preserves method protection', async () => {
    const response = await popularArticles(new Request('https://example.com/api/popular', { method: 'POST' }), allowed, database());
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET');
  });
});
