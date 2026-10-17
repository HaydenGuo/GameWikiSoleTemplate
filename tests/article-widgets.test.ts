import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

describe('generic article widget contract', () => {
  it('ships the reusable widget components without fork identity', () => {
    const componentPaths = [
      'src/components/mdx/ItemInlineIcon.astro',
      'src/components/mdx/DecisionFilter.astro',
      'src/components/mdx/TaskPlanner.astro',
      'src/components/mdx/ArticleFieldNote.astro',
      'src/components/mdx/ArticleReadinessDashboard.astro',
    ];

    for (const relativePath of componentPaths) {
      expect(existsSync(resolve(root, relativePath)), relativePath).toBe(true);
      const source = read(relativePath);
      expect(source, relativePath).not.toMatch(/Valheim|Anvil Quest|BlackMetal|valheim-item/i);
    }
  });

  it('renders article-level widgets from validated frontmatter', () => {
    const schema = read('src/content.config.ts');
    const article = read('src/components/article/ArticlePage.astro');

    expect(schema).toContain('keywords: z.array');
    expect(schema).toContain('decisionFilter: z');
    expect(schema).toContain('taskPlanner: z');
    expect(schema).toContain('articleTool: z');
    expect(article).toContain("import DecisionFilter from '@hb-game-wiki/template/components/mdx/DecisionFilter.astro';");
    expect(article).toContain("import TaskPlanner from '@hb-game-wiki/template/components/mdx/TaskPlanner.astro';");
    expect(article).toContain("import ArticleFieldNote from '@hb-game-wiki/template/components/mdx/ArticleFieldNote.astro';");
    expect(article).toContain("import ArticleReadinessDashboard from '@hb-game-wiki/template/components/mdx/ArticleReadinessDashboard.astro';");
    expect(article).toContain('decisionFilter &&');
    expect(article).toContain('taskPlanner &&');
    expect(article).toContain("articleTool?.type === 'field-note'");
    expect(article).toContain("articleTool?.type === 'readiness'");
    expect(article).toContain('keywords={entry.data.keywords}');
  });

  it('documents direct MDX calls and locale-controlled widget labels', () => {
    const docs = read('docs/content-format.md');
    const locale = read('src/locales/en.json');
    const styles = read('src/styles/globals.css');

    expect(docs).toContain('ItemInlineIcon');
    expect(docs).toContain('DecisionFilter');
    expect(docs).toContain('TaskPlanner');
    expect(docs).toContain('ArticleFieldNote');
    expect(docs).toContain('ArticleReadinessDashboard');
    expect(locale).toContain('"widgets"');
    expect(locale).toContain('"taskPlanner"');
    expect(locale).toContain('"readiness"');
    expect(styles).toContain(':has([data-item-inline-icon])');
  });
});
