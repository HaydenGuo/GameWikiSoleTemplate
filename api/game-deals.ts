import { site } from '../src/config/site';

const REGION = 'US';
const USER_AGENT = 'GameWikiTemplate/1.0 (https://github.com/HaydenGuo/GameWikiTemplate)';
const GAME_OFFERS_API = 'https://gameofferscenter.com/api';
const FANATICAL_MCP = 'https://mcp.fanatical.com/mcp';
const CHEAPSHARK_API = 'https://www.cheapshark.com/api/1.0';
const ONE_HOUR = 60 * 60;
const SHARED_CACHE_TTL = 6 * ONE_HOUR;
const CACHE_FRESH_MS = ONE_HOUR * 1000;
const REFRESH_LOCK_TTL = 45;
const REDIS_WAIT_MS = 10_000;
const REDIS_POLL_MS = 200;

type SharedPayload = { checkedAt?: string };

function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

async function redisCommand<T>(config: { url: string; token: string }, command: unknown[]): Promise<T> {
  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + config.token,
      'content-type': 'application/json',
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('Shared cache returned ' + response.status);
  const result = await response.json() as { result?: T; error?: string };
  if (result.error) throw new Error('Shared cache command failed');
  return result.result as T;
}

function parseSharedPayload(value: unknown): SharedPayload | null {
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value) as SharedPayload;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function isFresh(payload: SharedPayload): boolean {
  const checkedAt = Date.parse(String(payload.checkedAt ?? ''));
  return Number.isFinite(checkedAt) && Date.now() - checkedAt < CACHE_FRESH_MS;
}

function hasUsableSources(payload: SharedPayload): boolean {
  const sources = (payload as { sources?: Record<string, unknown> }).sources;
  return !sources || Object.values(sources).some((value) => value === true);
}

/**
 * Optional Upstash Redis cache provides a cross-instance refresh lock and
 * stale-on-refresh behavior. Without it, Vercel's shared CDN cache remains the
 * default; browser clients must use the canonical URL so CDN hits are reused.
 */
export async function withSharedCache<T extends SharedPayload>(
  logicalKey: string,
  producer: () => Promise<T>,
): Promise<T | null> {
  const config = redisConfig();
  if (!config) return producer();

  const cacheKey = 'game-deals:v1:' + logicalKey;
  const lockKey = cacheKey + ':refresh-lock';
  const cached = parseSharedPayload(await redisCommand<string | null>(config, ['GET', cacheKey]));
  if (cached && isFresh(cached)) return cached as T;

  const lockToken = crypto.randomUUID();
  const acquired = await redisCommand<string | null>(
    config,
    ['SET', lockKey, lockToken, 'NX', 'EX', REFRESH_LOCK_TTL],
  );

  if (acquired !== 'OK') {
    if (cached) return cached as T;
    const deadline = Date.now() + REDIS_WAIT_MS;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, REDIS_POLL_MS));
      const shared = parseSharedPayload(await redisCommand<string | null>(config, ['GET', cacheKey]));
      if (shared) return shared as T;
    }
    return null;
  }

  try {
    const fresh = await producer();
    if (!hasUsableSources(fresh) && cached) return cached as T;
    await redisCommand(config, [
      'SET',
      cacheKey,
      JSON.stringify(fresh),
      'EX',
      hasUsableSources(fresh) ? SHARED_CACHE_TTL : 60,
    ]).catch(() => undefined);
    return fresh;
  } catch (error) {
    if (cached) return cached as T;
    throw error;
  } finally {
    await redisCommand<number>(config, [
      'EVAL',
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      '1',
      lockKey,
      lockToken,
    ]).catch(() => undefined);
  }
}

type Offer = {
  id: string;
  title: string;
  store: string;
  source: string;
  currency: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  code: string | null;
  actionUrl: string;
  validUntil: string | null;
  verifiedAt: string;
};

function json(body: unknown, status = 200, cache = false, cacheSeconds = ONE_HOUR): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cache
        ? `public, max-age=0, s-maxage=${cacheSeconds}, stale-while-revalidate=300, stale-if-error=86400`
        : 'no-store',
    },
  });
}

async function fetchJson(url: string, init: RequestInit = {}, timeoutMs = 12000): Promise<any> {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
    headers: { accept: 'application/json', ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
  return response.json();
}

async function fetchSteam(appId: number, gameTitle: string): Promise<any> {
  const [store, players, chartPage] = await Promise.allSettled([
    fetchJson(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=en&cc=us`),
    fetchJson(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`),
    fetch(`https://store.steampowered.com/charts/mostplayed/?l=english&cc=us`, {
      headers: { 'user-agent': `Mozilla/5.0 (compatible; GameWikiTemplate/1.0; +${USER_AGENT})` },
      signal: AbortSignal.timeout(15000),
    }).then(async (response) => {
      if (!response.ok) throw new Error(`Steam chart returned ${response.status}`);
      return response.text();
    }),
  ]);
  const product = store.status === 'fulfilled' ? store.value?.[String(appId)]?.data : null;
  const price = product?.price_overview;
  const apiPlayerCount = players.status === 'fulfilled'
    ? Number(players.value?.response?.player_count)
    : null;
  const chartMetrics = chartPage.status === 'fulfilled'
    ? parseSteamChartRow(chartPage.value, appId)
    : null;
  return {
    ok: Boolean(product),
    appId,
    title: product?.name ?? gameTitle,
    headerImage: product?.header_image ?? null,
    url: `https://store.steampowered.com/app/${appId}/`,
    currency: price?.currency ?? 'USD',
    price: price ? Number(price.final) / 100 : null,
    formattedPrice: price?.final_formatted || null,
    originalPrice: price ? Number(price.initial) / 100 : null,
    discountPercent: price ? Number(price.discount_percent) : null,
    rank: chartMetrics?.rank ?? null,
    currentPlayers: chartMetrics?.currentPlayers ?? (Number.isFinite(apiPlayerCount) ? apiPlayerCount : null),
    dailyPeak: chartMetrics?.dailyPeak ?? null,
    observedAt: new Date().toISOString(),
  };
}

function parseSteamChartRow(html: string, appId: number): { rank: number; currentPlayers: number | null; dailyPeak: number | null } | null {
  const row = html.match(new RegExp(
    `<tr[^>]*>(?:(?!<\\/tr>)[\\s\\S])*?href="https:\\/\\/store\\.steampowered\\.com\\/app\\/${appId}\\/[^\"]*"(?:(?!<\\/tr>)[\\s\\S])*?<\\/tr>`,
    'i',
  ))?.[0];
  if (!row) return null;
  const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) =>
    match[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim(),
  );
  const rank = Number(cells[1]);
  const parseCount = (value: string | undefined) => {
    const count = Number(value?.replace(/[^\d]/g, ''));
    return Number.isFinite(count) ? count : null;
  };
  return Number.isFinite(rank)
    ? { rank, currentPlayers: parseCount(cells[4]), dailyPeak: parseCount(cells[5]) }
    : null;
}

function parseMcpResponse(text: string): any {
  const data = text.match(/^data:\s*(.+)$/m)?.[1];
  if (!data) throw new Error('Fanatical MCP returned no data');
  const envelope = JSON.parse(data);
  if (envelope.error) throw new Error('Fanatical MCP request failed');
  const result = envelope.result;
  if (result?.structuredContent) return result.structuredContent;
  const content = result?.content?.find((item: { type?: string }) => item.type === 'text')?.text;
  if (!content) throw new Error('Fanatical MCP returned an empty result');
  return JSON.parse(content);
}

async function fetchFanaticalOffers(query: string): Promise<Offer[]> {
  const headers = {
    accept: 'application/json, text/event-stream',
    'content-type': 'application/json',
  };
  const initialize = await fetch(FANATICAL_MCP, {
    method: 'POST',
    headers,
    signal: AbortSignal.timeout(12000),
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'transport-fever-3-wiki', version: '1.0.0' },
      },
    }),
  });
  if (!initialize.ok) throw new Error(`Fanatical MCP returned ${initialize.status}`);
  const sessionId = initialize.headers.get('mcp-session-id');
  if (!sessionId) throw new Error('Fanatical MCP did not create a session');

  const sessionHeaders = {
    ...headers,
    'mcp-session-id': sessionId,
    'mcp-protocol-version': '2025-06-18',
  };
  await fetch(FANATICAL_MCP, {
    method: 'POST',
    headers: sessionHeaders,
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  });
  const response = await fetch(FANATICAL_MCP, {
    method: 'POST',
    headers: sessionHeaders,
    signal: AbortSignal.timeout(12000),
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'search_products',
        arguments: { query, region: REGION, limit: 12, sort: 'price_asc' },
      },
    }),
  });
  if (!response.ok) throw new Error(`Fanatical MCP returned ${response.status}`);
  const result = parseMcpResponse(await response.text());
  const checkedAt = new Date().toISOString();
  return (result?.results ?? []).map((item: any): Offer => ({
    id: `fanatical:${item.product_id ?? item.slug}`,
    title: String(item.name ?? query),
    store: 'Fanatical',
    source: 'Fanatical MCP',
    currency: String(result.currency ?? 'USD'),
    price: Number(item.coupon?.coupon_price ?? item.price),
    originalPrice: Number.isFinite(Number(item.full_price)) ? Number(item.full_price) : null,
    discountPercent: Number.isFinite(Number(item.discount_percent)) ? Number(item.discount_percent) : null,
    code: item.coupon?.code ? String(item.coupon.code) : null,
    actionUrl: String(item.cart_url || item.coupon?.coupon_url || item.url || ''),
    validUntil: item.valid_until ? new Date(Number(item.valid_until) * 1000).toISOString() : null,
    verifiedAt: checkedAt,
  })).filter((item: Offer) => item.actionUrl && Number.isFinite(item.price) && item.price >= 0);
}

async function fetchCheapSharkOffers(appId: number, gameTitle: string, steamPrice: number | null): Promise<Offer[]> {
  const headers = {
    accept: 'application/json',
    'user-agent': USER_AGENT,
  };
  const [deals, stores] = await Promise.all([
    fetchJson(`${CHEAPSHARK_API}/deals?steamAppID=${appId}&pageSize=60`, { headers }),
    fetchJson(`${CHEAPSHARK_API}/stores`, { headers }),
  ]);
  const storeNames = new Map<string, string>(
    (stores as Array<{ storeID: string; storeName: string }>).map((store) => [store.storeID, store.storeName]),
  );
  const verifiedAt = new Date().toISOString();
  return (deals as any[]).flatMap((deal): Offer[] => {
    const price = Number(deal.salePrice);
    const originalPrice = Number(deal.normalPrice);
    if (
      !Number.isFinite(price) || price <= 0 ||
      !Number.isFinite(originalPrice) || originalPrice <= price ||
      steamPrice === null || Math.abs(originalPrice - steamPrice) > 0.02
    ) return [];
    return [{
      id: `cheapshark:${deal.dealID}`,
      title: gameTitle,
      store: storeNames.get(String(deal.storeID)) ?? 'Game retailer',
      source: 'CheapShark',
      currency: 'USD',
      price,
      originalPrice,
      discountPercent: Number(deal.savings),
      code: null,
      actionUrl: `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,
      validUntil: null,
      verifiedAt,
    }];
  });
}

async function fetchPopularGames(): Promise<any> {
  const [snapshot, chart] = await Promise.all([
    fetchJson(`${GAME_OFFERS_API}/steam-popular?region=${REGION}&limit=20`),
    fetchJson('https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/'),
  ]);
  const ranks = new Map<number, number>(
    (chart?.response?.ranks ?? []).map((item: any) => [Number(item.appid), Number(item.rank)]),
  );
  return {
    ...snapshot,
    chartCheckedAt: new Date().toISOString(),
    games: (snapshot?.games ?? []).flatMap((game: any) => {
      const rank = ranks.get(Number(game.appid));
      return rank && rank <= 20 ? [{ ...game, rank }] : [];
    }).sort((left: any, right: any) => Number(left.rank) - Number(right.rank)).slice(0, 20),
  };
}

async function fetchCurrentPopularOffers(games: any[]): Promise<any[]> {
  const needsStoreNames = games.some((game: any) =>
    (game.offers ?? game.coupons ?? []).some((offer: any) => offer.source === 'CheapShark API'),
  );
  const stores = needsStoreNames
    ? await fetchJson(`${CHEAPSHARK_API}/stores`).catch(() => [])
    : [];
  const storeNames = new Map<string, string>(
    (stores as Array<{ storeID: string; storeName: string }>).map((store) => [String(store.storeID), store.storeName]),
  );
  return games.slice(0, 20).flatMap((game: any) => {
    const sourceOffers = Array.isArray(game.offers) ? game.offers : Array.isArray(game.coupons) ? game.coupons : [];
    const offers = sourceOffers.flatMap((offer: any) => {
      const priceValue = offer.finalPrice ?? offer.basePrice ?? offer.price;
      const originalValue = offer.originalPrice;
      const price = priceValue == null || priceValue === '' ? null : Number(priceValue);
      const originalPrice = originalValue == null || originalValue === '' ? null : Number(originalValue);
      const displayPrice = price !== null && Number.isFinite(price)
        ? price
        : originalPrice !== null && Number.isFinite(originalPrice) ? originalPrice : null;
      const actionUrl = String(offer.actionUrl ?? offer.couponUrl ?? offer.sourceUrl ?? '');
      const code = offer.code ? String(offer.code) : null;
      const hasDiscount = displayPrice !== null && originalPrice !== null && Number.isFinite(originalPrice) && displayPrice < originalPrice;
      const expiry = offer.validUntil ? Date.parse(String(offer.validUntil)) : NaN;
      let safeActionUrl = false;
      try { safeActionUrl = new URL(actionUrl).protocol === 'https:'; } catch { /* Ignore malformed upstream links. */ }
      if (!safeActionUrl || displayPrice === null || (code === null && !hasDiscount) || (Number.isFinite(expiry) && expiry <= Date.now())) return [];
      return [{
        id: String(offer.id ?? `${game.appid}:${actionUrl}`),
        title: String(offer.title ?? game.title),
        store: storeNames.get(String(offer.store ?? '')) ?? String(offer.store ?? offer.source ?? 'Game Offers Center'),
        source: String(offer.source ?? 'Game Offers Center'),
        currency: String(offer.currency ?? 'USD'),
        price: displayPrice,
        originalPrice: originalPrice !== null && Number.isFinite(originalPrice) ? originalPrice : null,
        discountPercent: offer.discountPercent == null ? null : Number(offer.discountPercent),
        code,
        actionUrl,
        validUntil: offer.validUntil ? String(offer.validUntil) : null,
        verifiedAt: String(offer.lastVerifiedAt ?? offer.verifiedAt ?? game.checkedAt ?? ''),
      }];
    });
    if (!offers.length) return [];
    const players = game.currentPlayers == null ? null : Number(game.currentPlayers);
    return [{
      appId: Number(game.appid),
      rank: Number(game.rank),
      title: String(game.title),
      image: String(game.image ?? ''),
      steamUrl: String(game.steamUrl ?? `https://store.steampowered.com/app/${game.appid}/`),
      currentPlayers: players !== null && Number.isFinite(players) ? players : null,
      offers,
      checkedAt: String(game.checkedAt ?? game.offers?.[0]?.lastVerifiedAt ?? game.coupons?.[0]?.lastVerifiedAt ?? ''),
    }];
  });
}

async function buildPopularPayload(): Promise<any> {
  const result = await Promise.allSettled([fetchPopularGames()]);
  const snapshot = result[0].status === 'fulfilled' ? result[0].value : null;
  const games = snapshot?.games
    ? await fetchCurrentPopularOffers(snapshot.games).catch(() => [])
    : [];
  return {
    checkedAt: new Date().toISOString(),
    region: REGION,
    currency: 'USD',
    steam: null,
    offers: [],
    steamDiscountCount: 0,
    cheaperOfferCount: 0,
    savingsAgainstSteam: null,
    sources: {
      steam: false,
      fanatical: false,
      cheapShark: false,
      popularSnapshot: result[0].status === 'fulfilled',
    },
    popularity: {
      generatedAt: snapshot?.generatedAt ?? null,
      chartCheckedAt: snapshot?.chartCheckedAt ?? null,
      stale: Boolean(snapshot?.stale),
      games,
      source: 'Game Offers Center offers filtered to games currently ranked in Steam most-played top 20; Steam ranks are refreshed on this page refresh.',
    },
  };
}

async function buildPayload(appId: number, gameTitle: string): Promise<any> {
  const [steamResult, fanaticalResult, popularResult] = await Promise.allSettled([
    fetchSteam(appId, gameTitle),
    fetchFanaticalOffers(gameTitle),
    fetchPopularGames(),
  ]);
  const steam = steamResult.status === 'fulfilled' ? steamResult.value : null;
  const cheapSharkResult = steam?.price !== null && steam?.price !== undefined
    ? await Promise.allSettled([fetchCheapSharkOffers(appId, gameTitle, steam.price)]).then(([result]) => result)
    : { status: 'rejected' as const, reason: new Error('Steam price unavailable') };
  const cheapShark = cheapSharkResult.status === 'fulfilled' ? cheapSharkResult.value : [];
  const fanatical = fanaticalResult.status === 'fulfilled' ? fanaticalResult.value : [];
  const comparableFanatical = fanatical.filter((offer) =>
    offer.title.trim().toLowerCase() === gameTitle.trim().toLowerCase() &&
    offer.originalPrice !== null && typeof steam?.price === 'number' &&
    Math.abs(offer.originalPrice - steam.price) <= 0.02,
  );
  const candidates = [...comparableFanatical, ...cheapShark]
    .filter((offer) => typeof steam?.price === 'number' && offer.price < steam.price)
    .sort((a, b) => a.price - b.price || Number(Boolean(b.code)) - Number(Boolean(a.code)));
  const offers = [...new Map(candidates.map((offer) => [`${offer.store.toLowerCase()}:${offer.price.toFixed(2)}`, offer])).values()];
  const popularSnapshot = popularResult.status === 'fulfilled' ? popularResult.value : null;
  const popularGames = popularSnapshot?.games
    ? await fetchCurrentPopularOffers(popularSnapshot.games).catch(() => [])
    : [];
  return {
    checkedAt: new Date().toISOString(),
    region: REGION,
    currency: 'USD',
    steam,
    offers,
    steamDiscountCount: steam?.discountPercent > 0 ? 1 : 0,
    cheaperOfferCount: offers.length,
    savingsAgainstSteam: typeof steam?.price === 'number' && offers.length
      ? Math.max(0, steam.price - offers[0].price)
      : null,
    sources: {
      steam: steamResult.status === 'fulfilled' && Boolean(steam?.ok),
      fanatical: fanaticalResult.status === 'fulfilled',
      cheapShark: cheapSharkResult.status === 'fulfilled',
      popularSnapshot: popularResult.status === 'fulfilled',
    },
    popularity: {
      generatedAt: popularSnapshot?.generatedAt ?? null,
      chartCheckedAt: popularSnapshot?.chartCheckedAt ?? null,
      stale: Boolean(popularSnapshot?.stale),
      games: popularGames,
      source: 'Game Offers Center offers filtered to games currently ranked in Steam most-played top 20; Steam ranks are refreshed on this page refresh.',
    },
  };
}

function redirectToCanonical(request: Request, appId?: number): Response {
  const target = new URL(request.url);
  target.search = '';
  if (appId) target.searchParams.set('appid', String(appId));
  return new Response(null, {
    status: 308,
    headers: {
      location: target.toString(),
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rawAppId = (url.searchParams.get('appid') ?? '').trim();
  const appId = Number(rawAppId);
  const hasAppId = rawAppId.length > 0;
  const configuredAppId = site.game.steamAppId;
  const gameTitle = (site.game.steamGameTitle ?? site.game.name).trim().slice(0, 120);

  if (hasAppId && (!Number.isSafeInteger(appId) || appId <= 0)) {
    return json({ error: 'A valid Steam appid is required.' }, 400);
  }
  if (hasAppId && (!configuredAppId || appId !== configuredAppId)) {
    return json({ error: 'Configure this site\'s Steam appid before requesting game data.' }, 400);
  }
  if (hasAppId && (url.searchParams.size !== 1 || url.searchParams.getAll('appid').length !== 1 || rawAppId !== String(appId))) return redirectToCanonical(request, appId);
  if (!hasAppId && url.searchParams.size > 0) return redirectToCanonical(request);

  const key = hasAppId ? 'appid:' + appId + ':' + REGION : 'popular:' + REGION;
  try {
    const payload = await withSharedCache(key, () =>
      hasAppId ? buildPayload(appId, gameTitle) : buildPopularPayload(),
    );
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Game data is being refreshed. Retry shortly.' }), {
        status: 503,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'retry-after': '3',
        },
      });
    }
    return json(payload, 200, true, hasUsableSources(payload) ? ONE_HOUR : 60);
  } catch {
    return json({ error: 'Game data is temporarily unavailable.' }, 503, false);
  }
}
