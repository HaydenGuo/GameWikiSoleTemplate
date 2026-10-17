import { describe, expect, test } from 'vitest';
import { ARTICLE_TEMPLATE } from '~/config/article-template';

describe('article template contract', () => {
  test('keeps fixed regions around one editable body slot', () => {
    expect(ARTICLE_TEMPLATE.format).toEqual(['quick-answer', 'body', 'sources']);
    expect(ARTICLE_TEMPLATE.fixedRegions).toEqual(['quick-answer', 'sources']);
    expect(ARTICLE_TEMPLATE.editableRegion).toBe('body');
  });
});
