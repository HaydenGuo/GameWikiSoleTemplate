import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

describe('homepage closing carousel layout contract', () => {
  it('uses the shared full-bleed section API and scrollbar-aware symmetric gutters', () => {
    const page = readFileSync(`${root}/src/components/home/HomePage.astro`, 'utf8');
    expect(page).toContain('class="section section-full-bleed border-t border-border" data-home-closing-cta-section');
    expect(page).toContain('width: calc(100vw - 2 * var(--home-bleed-gutter))');
    expect(page).toContain('margin-left: calc(50% - 50vw + var(--home-bleed-gutter))');
    expect(page).toContain('left: auto');
    expect(page).toContain('transform: none');
    expect(page).toContain("event.key === 'ArrowLeft'");
    expect(page).toContain("event.key === 'ArrowRight'");
  });
});
