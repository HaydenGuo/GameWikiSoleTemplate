export const HOMEPAGE_CLICK_EVENT = 'homepage_nav_click' as const;

export interface HomepageClickPayload {
  slot: string;
  item: string;
  targetPath: string;
  variant: string;
  locale: string;
}

export interface HomepageAnalyticsTarget {
  __awAnalyticsReady?: boolean;
  gtag?: (...args: unknown[]) => void;
}

declare global {
  interface Window extends HomepageAnalyticsTarget {}
}

/** Send a homepage navigation event only after the consent-gated GA loader is ready. */
export function trackHomepageClick(
  target: HomepageAnalyticsTarget,
  payload: HomepageClickPayload,
): boolean {
  if (!target.__awAnalyticsReady || typeof target.gtag !== 'function') return false;

  target.gtag('event', HOMEPAGE_CLICK_EVENT, {
    slot: payload.slot,
    item: payload.item,
    target_path: payload.targetPath,
    variant: payload.variant,
    locale: payload.locale,
  });
  return true;
}
