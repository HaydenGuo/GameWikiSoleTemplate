import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

const readJson = <T>(relativePath: string): T =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;

describe('unified GameWikiSoleTemplate package contract', () => {
  it('uses the single-repository package identity', () => {
    const packageJson = readJson<{ name?: string }>('package.json');
    expect(packageJson.name).toBe('gamewiki-sole-template');
  });

  it('does not depend on a separately installed GameWikiCore package', () => {
    const packageJson = readJson<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    }>('package.json');
    const dependencyGroups = [
      packageJson.dependencies,
      packageJson.devDependencies,
      packageJson.optionalDependencies,
      packageJson.peerDependencies,
    ];

    expect(dependencyGroups.some((group) => group?.['@hb-game-wiki/template'])).toBe(false);
    expect(fs.readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8')).not.toContain('GameWikiCore');
    const tsconfig = JSON.stringify(readJson<{ compilerOptions?: { paths?: Record<string, string[]> } }>('tsconfig.json'));
    expect(tsconfig).not.toContain('@hb-game-wiki/template');
  });

  it('does not install a source-link or junction boundary workflow', () => {
    const packageJson = readJson<{ scripts?: Record<string, string> }>('package.json');
    const scriptText = JSON.stringify(packageJson.scripts ?? {});

    expect(scriptText).not.toContain('template:link');
    expect(scriptText).not.toContain('check-template-boundary');
    expect(fs.existsSync(path.join(root, 'scripts', 'link-template-source.mjs'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'scripts', 'check-template-boundary.ts'))).toBe(false);
  });

  it('tracks the unified runtime directories as source files', () => {
    const runtimeFiles = [
      'src/components/TemplateProbe.astro',
      'src/i18n/template-probe.ts',
      'src/lib/template-probe.ts',
      'src/pages/template-probe.astro',
      'src/styles/template-probe.css',
      'src/config/article-template.ts',
    ];
    const ignored = runtimeFiles.filter((file) => {
      const result = spawnSync('git', ['check-ignore', '--quiet', file], { cwd: root });
      if (result.error) throw result.error;
      return result.status === 0;
    });

    expect(ignored).toEqual([]);
  });

  it('keeps Quick Answer and Sources fixed around the editable body', () => {
    const articleTemplate = fs.readFileSync(path.join(root, 'src', 'config', 'article-template.ts'), 'utf8');

    expect(articleTemplate).toContain("format: ['quick-answer', 'body', 'sources'] as const");
    expect(articleTemplate).toContain("fixedRegions: ['quick-answer', 'sources'] as const");
    expect(articleTemplate).toContain("editableRegion: 'body' as const");
  });

  it('uses local imports in runtime and example content', () => {
    const sourceDirectories = ['src/components', 'src/i18n', 'src/lib', 'src/pages', 'src/content'];
    const sourceFiles = sourceDirectories.flatMap((directory) =>
      fs.readdirSync(path.join(root, directory), { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile() && /\.(astro|ts|tsx|mdx)$/.test(entry.name))
        .map((entry) => path.join(entry.parentPath, entry.name)),
    );
    for (const file of sourceFiles) {
      expect(fs.readFileSync(file, 'utf8'), path.relative(root, file)).not.toContain('@hb-game-wiki/template/');
    }
  });
});
