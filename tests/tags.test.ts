import { describe, it, expect } from 'vitest';
import { videoObjectJsonLd, urlListJsonLd, imageObjectJsonLd } from '~/lib/seo';
import { recentPath } from '~/lib/url';
import { locales } from '~/i18n/routing';

const nonDefaultLocale = locales.find((locale) => locale !== 'en');

describe('recent URL helper', () => {
  it('builds unprefixed English path', () => {
    expect(recentPath('en')).toBe('/recent/');
  });
  it('prefixes non-default locale', () => {
    if (!nonDefaultLocale) return;
    expect(recentPath(nonDefaultLocale)).toBe(`/${nonDefaultLocale}/recent/`);
  });
});

describe('videoObjectJsonLd', () => {
  it('builds a VideoObject with YouTube thumbnail and embed URLs', () => {
    const json = videoObjectJsonLd({
      videoId: 'dQw4w9WgXcQ',
      title: 'Test',
      uploadDate: new Date('2026-01-01'),
    });
    expect(json['@type']).toBe('VideoObject');
    expect(json.thumbnailUrl[0]).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    expect(json.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(json.uploadDate).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('imageObjectJsonLd', () => {
  it('builds an ImageObject with contentUrl and optional caption', () => {
    const json = imageObjectJsonLd({ url: 'https://example.com/img.webp', caption: 'Arena' });
    expect(json['@type']).toBe('ImageObject');
    expect(json.contentUrl).toBe('https://example.com/img.webp');
    expect(json.name).toBe('Arena');
  });
  it('omits caption fields when no caption given', () => {
    const json = imageObjectJsonLd({ url: 'https://example.com/img.webp' });
    expect(json.name).toBeUndefined();
  });
});

describe('urlListJsonLd', () => {
  it('numbers items from 1 with absolute URLs preserved', () => {
    const json = urlListJsonLd({
      name: 'Fire',
      items: [
        { title: 'A', url: 'https://example.com/bosses/a' },
        { title: 'B', url: 'https://example.com/bosses/b' },
      ],
    });
    expect(json.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'A',
      url: 'https://example.com/bosses/a',
    });
    expect(json.itemListElement[1].position).toBe(2);
  });
});
