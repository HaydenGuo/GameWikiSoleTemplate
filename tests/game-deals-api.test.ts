import { afterEach, describe, expect, test, vi } from 'vitest';
import { GET, withSharedCache } from '../api/game-deals';
import { site } from '../src/config/site';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Vercel game-deals Function', () => {
  test('rejects an invalid Steam app ID before making any upstream requests', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await GET(
      new Request('https://template.test/api/game-deals?appid=invalid'),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({
      error: 'A valid Steam appid is required.',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('rejects app IDs other than this site\'s configured game', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await GET(
      new Request('https://template.test/api/game-deals?appid=' + (site.game.steamAppId! + 1)),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('redirects legacy title and refresh parameters to one canonical cache key', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await GET(
      new Request('https://template.test/api/game-deals?appid=' + site.game.steamAppId + '&title=Other%20Game&refresh=1&t=123'),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(
      'https://template.test/api/game-deals?appid=' + site.game.steamAppId,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('a shared refresh lock coalesces concurrent cold-cache requests', async () => {
    const values = new Map<string, string>();
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
    vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const command = JSON.parse(String(init?.body)) as unknown[];
      const name = String(command[0]);
      const key = String(command[1]);
      let result: unknown = null;
      if (name === 'GET') {
        result = values.get(key) ?? null;
      } else if (name === 'SET') {
        const args = command.slice(2).map(String);
        if (args.includes('NX')) {
          if (!values.has(key)) {
            values.set(key, args[0]);
            result = 'OK';
          }
        } else {
          values.set(key, args[0]);
          result = 'OK';
        }
      } else if (name === 'EVAL') {
        values.delete(String(command[3]));
        result = 1;
      }
      return new Response(JSON.stringify({ result }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }));

    let upstreamCalls = 0;
    const produce = async () => {
      upstreamCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 25));
      return { checkedAt: new Date().toISOString(), value: 'shared' };
    };
    const [first, second] = await Promise.all([
      withSharedCache('appid:123:US', produce),
      withSharedCache('appid:123:US', produce),
    ]);

    expect(upstreamCalls).toBe(1);
    expect(first?.value).toBe('shared');
    expect(second?.value).toBe('shared');
  });
});
