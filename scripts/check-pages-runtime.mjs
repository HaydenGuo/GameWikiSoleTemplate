const baseUrl = (process.env.PAGES_PREVIEW_URL ?? 'http://127.0.0.1:4322').replace(/\/$/, '');

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return response;
}

try {
  const home = await get('/');
  console.log(`Homepage: HTTP ${home.status}`);

  const response = await get('/api/game-deals');
  const payload = await response.json();
  if (!payload || typeof payload !== 'object' || !payload.sources || !payload.popularity) {
    throw new Error('/api/game-deals returned an unexpected JSON shape');
  }
  if (typeof payload.popularity.stale !== 'boolean') {
    throw new Error('/api/game-deals did not report upstream popularity freshness');
  }

  console.log(`/api/game-deals: HTTP ${response.status}; valid JSON`);
  console.log(`Popularity upstream stale: ${payload.popularity.stale ? 'yes' : 'no'}`);
} catch (error) {
  console.error(`Pages runtime check failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
