/**
 * The immutable article shell. Content authors and AI may fill the declared
 * data fields and write the body slot, but they must not recreate or reorder
 * these page-level regions inside MDX.
 */
export const ARTICLE_TEMPLATE = {
  id: 'default-article',
  format: ['quick-answer', 'body', 'sources'] as const,
  fixedRegions: ['quick-answer', 'sources'] as const,
  editableRegion: 'body' as const,
} as const;

export type ArticleTemplateId = typeof ARTICLE_TEMPLATE.id;
