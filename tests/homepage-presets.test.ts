import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const allowedNavigation = ['guides', 'builds', 'items', 'maps', 'bosses', 'tier-list', 'news', 'codes'];

describe('homepage presets', () => {
  for (const preset of ['codes', 'guides']) {
    it(`${preset} stores a complete, allowed preset definition`, () => {
      const file = resolve(ROOT, 'presets', `${preset}.json`);
      expect(existsSync(file), `${preset} preset must exist`).toBe(true);

      const value = JSON.parse(readFileSync(file, 'utf8')) as {
        name?: unknown;
        home?: unknown;
        navigation?: unknown;
      };

      expect(value.name).toBeTypeOf('string');
      expect(value.home).toBeTypeOf('object');
      expect(value.navigation).toEqual(
        expect.arrayContaining([expect.any(String)]),
      );
      expect((value.navigation as string[]).every((key) => allowedNavigation.includes(key))).toBe(true);
    });
  }
});
