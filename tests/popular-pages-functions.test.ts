import { describe, expect, it, vi } from 'vitest';
import { articleView, popularArticles, type D1Database, type D1PreparedStatement } from '../functions/lib/popular.js';

const allowed = new Set(['/guides/emberfang/']);

function database(overrides: Partial<D1PreparedStatement> = {}): D1Database {
  const statement: D1PreparedStatement = {
    bind: vi.fn(() => statement),
    all: vi.fn(async () => ({ results: [{ slug: '/guides/emberfang/', views: 4 }] })) as unknown as D1PreparedStatement['all'],
    run: vi.fn(async () => undefined),
    ...overrides,
  };
  return { prepare: vi.fn(() => statement) };
}

describe('Cloudflare Pages Popular functions', () => {
  it('returns 503 when the optional D1 binding is absent', async () => {
    const response = await articleView(
      { request: new Request('https://example.com/api/article-view', { method: 'POST', body: '{"slug":"/guides/emberfang/"}' }), env: {} },
      allowed,
    );
    expect(response.status).toBe(503);
  });

  it('rejects an unknown article slug before touching D1', async () => {
    const prepare = vi.fn();
    const response = await articleView(
      {
        request: new Request('https://example.com/api/article-view', {
          method: 'POST',
          headers: { origin: 'https://example.com', 'content-type': 'application/json' },
          body: '{"slug":"/guides/not-published/"}',
        }),
        env: { POPULAR_DB: { prepare } },
      },
      allowed,
    );
    expect(response.status).toBe(400);
    expect(prepare).not.toHaveBeenCalled();
  });

  it('writes a valid view and returns 204', async () => {
    const db = database();
    const response = await articleView(
      {
        request: new Request('https://example.com/api/article-view', {
          method: 'POST',
          headers: { origin: 'https://example.com', 'content-type': 'application/json' },
          body: '{"slug":"/guides/emberfang/"}',
        }),
        env: { POPULAR_DB: db },
      },
      allowed,
    );
    expect(response.status).toBe(204);
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO article_views_daily'));
  });

  it('returns the D1 ranking for a valid GET request', async () => {
    const response = await popularArticles(
      { request: new Request('https://example.com/api/popular?days=7&limit=3'), env: { POPULAR_DB: database() } },
      allowed,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ slug: '/guides/emberfang/', views: 4 }]);
  });
});
