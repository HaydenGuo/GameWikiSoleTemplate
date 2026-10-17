import type { ImageMetadata } from 'astro';

const articleAssets = import.meta.glob('/src/assets/articles/**/*.{png,jpg,jpeg,webp,avif,gif}', {
  eager: true,
  import: 'default',
}) as Record<string, ImageMetadata>;

function normalizeAssetRef(ref: string): string {
  const normalized = ref.replace(/\\/g, '/');
  const marker = '/assets/articles/';
  const index = normalized.indexOf(marker);
  return index >= 0 ? `/src${normalized.slice(index)}` : normalized;
}

/** Resolve the first ArticleImage reference to Astro's processed metadata. */
export function resolveArticleImage(ref: string): ImageMetadata | string | undefined {
  if (ref.startsWith('/images/')) return ref;
  const normalized = normalizeAssetRef(ref);
  const direct = articleAssets[normalized];
  if (direct) return direct;
  const match = Object.entries(articleAssets).find(([key]) => key.endsWith(normalized));
  return match?.[1];
}
