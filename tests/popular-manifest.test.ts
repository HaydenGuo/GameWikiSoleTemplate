import { describe, expect, it } from 'vitest';
import { collectPublishedArticleSlugs } from '../scripts/lib/popular-manifest.ts';

describe('Popular article slug manifest', () => {
  it('includes published English MDX articles and excludes drafts, future posts, and non-articles', () => {
    const now = new Date('2026-09-05T00:00:00.000Z');
    const entries = [
      { relativePath: 'en/guides/beginner-guide.mdx', source: "---\ntitle: Test\ndate: '2026-09-01'\n---" },
      { relativePath: 'en/codes/all-codes.mdx', source: "---\ntitle: Test\ndate: '2026-09-01'\ndraft: true\n---" },
      { relativePath: 'en/bosses/future-boss.mdx', source: "---\ntitle: Test\ndate: '2026-10-01'\n---" },
      { relativePath: 'en/guides/README.md', source: "---\ndate: '2026-09-01'\n---" },
      { relativePath: 'ja/guides/not-english.mdx', source: "---\ndate: '2026-09-01'\n---" },
    ];

    expect(collectPublishedArticleSlugs(entries, now)).toEqual(['/guides/beginner-guide/']);
  });
});
