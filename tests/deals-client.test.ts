import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');
const source = readFileSync(resolve(root, 'src/components/deals/DealsPage.astro'), 'utf8');
const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (!script) throw new Error('Deals client script is missing');
const client = ts.transpileModule(script, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
const copy = JSON.parse(readFileSync(resolve(root, 'src/locales/en.json'), 'utf8')).dealsPage;

function element(textContent = '') {
  return {
    textContent,
    innerHTML: '',
    disabled: false,
    href: 'https://store.steampowered.com/',
    attributes: new Map<string, string>([['aria-busy', 'true']]),
    listeners: new Map<string, () => void>(),
    setAttribute(name: string, value: string) { this.attributes.set(name, value); },
    addEventListener(name: string, callback: () => void) { this.listeners.set(name, callback); },
    style: { setProperty: vi.fn() },
  };
}

function start(fetch: typeof globalThis.fetch) {
  const page = { dataset: { dealsCopy: JSON.stringify(copy), steamAppId: '123' } };
  const metrics = element(copy.loading);
  metrics.innerHTML = copy.loading;
  const popular = element(copy.loadingPopular);
  popular.innerHTML = copy.loadingPopular;
  const updated = element(copy.checkingPrices);
  const refresh = element(copy.refreshNow);
  const direct = element(copy.viewSteam);
  const selectors = new Map<string, unknown>([
    ['[data-deals-copy]', page], ['#poster-metrics', metrics], ['#popular-offers', popular],
    ['#deals-updated', updated], ['#deals-refresh', refresh], ['#deals-direct-link', direct],
    ['#popular-snapshot-note', element(copy.loadingPopular)], ['.deals-hero', element()],
  ]);
  runInNewContext(client, {
    document: { querySelector: (selector: string) => selectors.get(selector) ?? null, addEventListener: vi.fn() },
    window: { setInterval: vi.fn() },
    localStorage: { getItem: () => null, setItem: vi.fn() },
    fetch, URL, Intl, Date,
  });
  return { metrics, popular, updated, refresh, direct };
}

const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json' },
});
const empty = () => ({
  checkedAt: new Date().toISOString(), steam: null, offers: [], popularity: { games: [] },
});

describe('Deals client request states', () => {
  it.each(['http', 'network'])('settles initial %s failure without claiming data or leaving loading regions', async (failure) => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    if (failure === 'http') fetch.mockResolvedValue(response({ error: 'unavailable' }, 503));
    else fetch.mockRejectedValue(new TypeError('offline'));
    const view = start(fetch);

    await vi.waitFor(() => expect(view.updated.textContent).toBe(copy.refreshError));
    expect(view.metrics.attributes.get('aria-busy')).toBe('false');
    expect(view.popular.attributes.get('aria-busy')).toBe('false');
    expect(view.metrics.innerHTML).not.toContain(copy.loading);
    expect(view.metrics.innerHTML).toContain(copy.unavailable);
    expect(view.popular.innerHTML).toContain(copy.noPopularOffers.replaceAll("'", '&#39;'));
    expect(view.refresh.disabled).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[0]).toBe('/api/game-deals?appid=123');
  });

  it('retains the last successful values and destination after a failed refresh', async () => {
    const payload = {
      ...empty(),
      steam: { price: 30, currency: 'USD', currentPlayers: 4321, rank: 8 },
      offers: [{ price: 20, currency: 'USD', store: 'Store', actionUrl: 'https://store.example/buy/' }],
    };
    const fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(response(payload))
      .mockResolvedValueOnce(response({ error: 'unavailable' }, 503));
    const view = start(fetch);
    await vi.waitFor(() => expect(view.metrics.innerHTML).toContain('4,321'));
    const lastMetrics = view.metrics.innerHTML;
    const lastPopular = view.popular.innerHTML;
    expect(view.direct.href).toBe('https://store.example/buy/');
    view.refresh.listeners.get('click')?.();

    await vi.waitFor(() => expect(view.updated.textContent).toBe(copy.refreshError));
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(view.metrics.innerHTML).toBe(lastMetrics);
    expect(view.popular.innerHTML).toBe(lastPopular);
    expect(view.direct.href).toBe('https://store.example/buy/');
    expect(view.metrics.attributes.get('aria-busy')).toBe('false');
    expect(view.popular.attributes.get('aria-busy')).toBe('false');
  });

  it('preserves the empty-success state and marks both regions ready', async () => {
    const view = start(vi.fn<typeof globalThis.fetch>().mockResolvedValue(response(empty())));
    await vi.waitFor(() => expect(view.updated.textContent).toContain(copy.checkedAt));
    expect(view.metrics.attributes.get('aria-busy')).toBe('false');
    expect(view.popular.attributes.get('aria-busy')).toBe('false');
    expect(view.metrics.innerHTML).not.toContain(copy.loading);
    expect(view.popular.innerHTML).toContain(copy.noPopularOffers);
    expect(view.updated.textContent).not.toBe(copy.refreshError);
  });

  it('keeps loading and refresh disabled until a pending first request finishes', async () => {
    let finish!: (value: Response) => void;
    const pending = new Promise<Response>((resolve) => { finish = resolve; });
    const view = start(vi.fn<typeof globalThis.fetch>().mockReturnValue(pending));
    expect(view.metrics.innerHTML).toContain(copy.loading);
    expect(view.metrics.attributes.get('aria-busy')).toBe('true');
    expect(view.popular.attributes.get('aria-busy')).toBe('true');
    expect(view.refresh.disabled).toBe(true);

    finish(response(empty()));
    await vi.waitFor(() => expect(view.metrics.attributes.get('aria-busy')).toBe('false'));
    expect(view.popular.attributes.get('aria-busy')).toBe('false');
    expect(view.refresh.disabled).toBe(false);
  });
});
