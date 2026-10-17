export interface SourcePolicy {
  officialOrigin: string;
  redditPath?: string;
  trustedPages: Set<string>;
}

export interface SourceCheckResult {
  allowed: boolean;
  reason?: string;
}

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be']);
const STEAM_HOSTS = new Set(['store.steampowered.com', 'steamcommunity.com', 'www.steamcommunity.com']);
const REDDIT_HOSTS = new Set(['reddit.com', 'www.reddit.com', 'old.reddit.com', 'np.reddit.com']);

function normalizePath(pathname: string): string {
  const normalized = pathname.replace(/\/+/g, '/').replace(/\/+$|^$/, '');
  return normalized ? `/${normalized.replace(/^\//, '')}` : '/';
}

function originOf(value: string): string | null {
  try {
    const url = new URL(value);
    if (!/^https?:$/i.test(url.protocol)) return null;
    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeTrustedPage(value: string): string | null {
  try {
    const url = new URL(value);
    if (!/^https?:$/i.test(url.protocol)) return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

export function createSourcePolicy(
  officialUrl: string,
  redditUrl?: string,
  trustedStorePages: string[] = [],
  trustedMaterialPages: string[] = [],
): SourcePolicy {
  const officialOrigin = originOf(officialUrl) ?? '';
  const trustedPages = new Set(
    [...trustedStorePages, ...trustedMaterialPages]
      .map(normalizeTrustedPage)
      .filter((page): page is string => page !== null),
  );
  let redditPath: string | undefined;
  if (redditUrl) {
    try {
      const url = new URL(redditUrl);
      if (REDDIT_HOSTS.has(url.hostname.toLowerCase())) {
        const path = normalizePath(url.pathname);
        if (/^\/r\/[^/]+$/i.test(path)) redditPath = path.toLowerCase();
      }
    } catch {
      // An invalid optional Reddit config simply disables Reddit sources.
    }
  }
  return { officialOrigin, redditPath, trustedPages };
}

export function isAllowedArticleSource(value: string, policy: SourcePolicy): SourceCheckResult {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { allowed: false, reason: 'source URL is not valid' };
  }
  if (!/^https?:$/i.test(url.protocol)) {
    return { allowed: false, reason: 'source URL must use http or https' };
  }

  const host = url.hostname.toLowerCase();
  const origin = url.origin.toLowerCase();
  if (policy.trustedPages.has(normalizeTrustedPage(value) ?? '')) return { allowed: true };
  if (policy.officialOrigin && origin === policy.officialOrigin) return { allowed: true };
  if (YOUTUBE_HOSTS.has(host)) return { allowed: true };
  if (STEAM_HOSTS.has(host)) return { allowed: true };

  if (REDDIT_HOSTS.has(host) && policy.redditPath) {
    const path = normalizePath(url.pathname).toLowerCase();
    if (path === policy.redditPath || path.startsWith(`${policy.redditPath}/`)) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reason: 'only the configured official site, YouTube, Steam, or the configured game subreddit is allowed',
  };
}
