import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = fs.realpathSync(path.join(root, 'node_modules', '@hb-game-wiki', 'template'));
const configPath = path.join(root, 'src', 'config', 'art-typography.ts');
const config = fs.readFileSync(configPath, 'utf8');
const style = config.match(/artTypographyStyle\s*=\s*['"]([a-z]+)['"]/)?.[1];
const styles = new Set(['poster', 'arcade', 'gothic', 'playful']);
if (!style || !styles.has(style)) {
  throw new Error(`Unknown artTypographyStyle. Choose one of: ${[...styles].join(', ')}.`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(packageRoot, relativePath), 'utf8');
}

function write(relativePath, value) {
  const filePath = path.join(packageRoot, relativePath);
  if (fs.readFileSync(filePath, 'utf8') === value) return;
  const temporaryPath = `${filePath}.art-typography-tmp`;
  fs.writeFileSync(temporaryPath, value);
  fs.renameSync(temporaryPath, filePath);
}

function replaceOnce(source, search, replacement, label) {
  const normalized = source.replace(/\r\n/g, '\n');
  const normalizedSearch = search.replace(/\r\n/g, '\n');
  const normalizedReplacement = replacement.replace(/\r\n/g, '\n');
  if (normalized.includes(normalizedReplacement)) return source;
  const count = normalized.split(normalizedSearch).length - 1;
  if (count !== 1) throw new Error(`Expected one ${label} insertion point; found ${count}.`);
  const updated = normalized.replace(normalizedSearch, normalizedReplacement);
  return source.includes('\r\n') ? updated.replace(/\n/g, '\r\n') : updated;
}

const layoutPath = 'src/components/layout/BaseLayout.astro';
let layout = read(layoutPath);
layout = replaceOnce(
  layout,
  "import { site, siteUrl } from '~/config/site';",
  "import { site, siteUrl } from '~/config/site';\nimport { artTypographyStyle } from '~/config/art-typography';",
  'layout typography config import',
);
layout = replaceOnce(
  layout,
  '<html lang={mainLocale} class="scroll-smooth">',
  '<html lang={mainLocale} class="scroll-smooth" data-game-art-style={artTypographyStyle}>',
  'root typography attribute',
);
write(layoutPath, layout);

const headerPath = 'src/components/header/SiteHeader.astro';
let header = read(headerPath);
header = replaceOnce(
  header,
  '<span class="hidden sm:inline">{site.shortName}</span>',
  '<span class="game-art-wordmark hidden sm:inline">{site.shortName}</span>',
  'header wordmark class',
);
write(headerPath, header);

const coverPath = 'src/components/article/ArticleCover.astro';
let cover = read(coverPath);
cover = replaceOnce(
  cover,
  '<p class="line-clamp-2 text-base font-bold leading-tight text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] md:text-lg">{title}</p>',
  '<p class="game-art-cover-title line-clamp-2 text-base font-bold leading-tight text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] md:text-lg">{title}</p>',
  'article cover title class',
);
write(coverPath, cover);

const homePath = 'src/components/home/HomePage.astro';
let home = read(homePath);
home = replaceOnce(
  home,
  'const hero = home.hero ?? {};',
  `const hero = home.hero ?? {};
if (!Array.isArray(hero.descriptionItems) || hero.descriptionItems.length !== 2 || hero.descriptionItems.some((item: any) => typeof item?.label !== 'string' || !item.label.trim() || typeof item?.text !== 'string' || !item.text.trim())) {
  throw new Error('Homepage contract violation: home.hero.descriptionItems must contain exactly two sections with non-empty labels and text.');
}`,
  'mandatory homepage introduction guard',
);
home = replaceOnce(
  home,
  'class="mt-3 max-w-3xl bg-gradient-to-r from-white via-white to-white/75 bg-clip-text text-4xl font-black tracking-tight text-transparent drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl"',
  'class="game-art-hero-title mt-3 max-w-3xl bg-gradient-to-r from-white via-white to-white/75 bg-clip-text text-4xl font-black tracking-tight text-transparent drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl"',
  'homepage title class',
);
if (!home.includes('class="game-art-hero-copy__item"')) {
  const oldHeroDescription = '<p class="mt-5 max-w-xl text-base text-white/90 drop-shadow-md md:text-lg">{hero.description}</p>';
  const mandatoryIntro = `<div class="game-art-hero-copy mt-5 max-w-xl space-y-4 text-base text-white/90 drop-shadow-md md:text-lg">
        {hero.descriptionItems.map((item: { label: string; text: string }) => (
          <p class="game-art-hero-copy__item"><strong class="game-art-hero-copy__label">{item.label}</strong><span class="game-art-hero-copy__text">{item.text}</span></p>
        ))}
      </div>`;
  if (home.includes(oldHeroDescription)) {
    home = replaceOnce(home, oldHeroDescription, mandatoryIntro, 'mandatory homepage description items');
  } else {
    home = replaceOnce(
      home,
      `{Array.isArray(hero.descriptionItems) && hero.descriptionItems.length > 0 ? (
        <div class="game-art-hero-copy mt-5 max-w-xl space-y-4 text-base text-white/90 drop-shadow-md md:text-lg">
          {hero.descriptionItems.map((item: { label: string; text: string }) => (
            <p class="game-art-hero-copy__item"><strong class="game-art-hero-copy__label">{item.label}</strong><span class="game-art-hero-copy__text">{item.text}</span></p>
          ))}
        </div>
      ) : (
        <p class="mt-5 max-w-xl text-base text-white/90 drop-shadow-md md:text-lg">{hero.description}</p>
      )}`,
      mandatoryIntro,
      'mandatory homepage description items',
    );
  }
}
home = replaceOnce(
  home,
  '<h2 class="text-2xl font-bold text-white drop-shadow-md md:text-3xl">{closingCta.title}</h2>',
  '<h2 class="game-art-cta-title text-2xl font-bold text-white drop-shadow-md md:text-3xl">{closingCta.title}</h2>',
  'closing carousel title class',
);
home = replaceOnce(
  home,
  '<p class="mx-auto mt-2 max-w-xl text-white/85 drop-shadow-md">{closingCta.description}</p>',
  '<p class="game-art-cta-description mx-auto mt-2 max-w-xl text-white/85 drop-shadow-md">{closingCta.description}</p>',
  'closing carousel description class',
);
home = replaceOnce(
  home,
  'href={site.social.official}',
  'href={closingCta.primaryHref ?? site.social.official}',
  'closing carousel primary destination',
);
home = home.replace(
  /href=\{closingCta\.primaryHref \?\? site\.social\.official\}\r?\n\s+target="_blank"\r?\n\s+rel="noopener noreferrer"/,
  'href={closingCta.primaryHref ?? site.social.official}\n              target={/^https?:\\/\\//i.test(closingCta.primaryHref ?? site.social.official) ? "_blank" : undefined}\n              rel={/^https?:\\/\\//i.test(closingCta.primaryHref ?? site.social.official) ? "noopener noreferrer" : undefined}',
);
home = replaceOnce(
  home,
  '              data-home-item="official"',
  '              data-home-item={closingCta.primaryHref ? "custom" : "official"}',
  'closing carousel destination tracking',
);
home = home.replace(
  'class="group overflow-hidden rounded-md border bg-card text-sm font-medium transition hover:-translate-y-0.5 hover:border-nav/50 hover:shadow-md"',
  'class="group block overflow-hidden rounded-md border bg-card text-sm font-medium transition hover:-translate-y-0.5 hover:border-nav/50 hover:shadow-md"',
);
write(homePath, home);

const stylesPath = 'src/styles/generated.css';
const markerStart = '/* Game site art typography start */';
const markerEnd = '/* Game site art typography end */';
const css = `${markerStart}
html[data-game-art-style] .game-art-hero-title,
html[data-game-art-style] .game-art-cta-title {
  width: fit-content;
  max-width: 100%;
  color: #fff;
  -webkit-text-fill-color: #fff;
  line-height: 0.98;
  text-shadow: 0 0.07em 0.18em rgb(0 0 0 / 0.72);
}

html[data-game-art-style="poster"] .game-art-hero-title,
html[data-game-art-style="poster"] .game-art-cta-title,
html[data-game-art-style="poster"] .game-art-wordmark,
html[data-game-art-style="poster"] .game-art-cover-title {
  font-family: "Arial Black", "Trebuchet MS", ui-sans-serif, system-ui, sans-serif;
  font-style: normal;
  font-weight: 900;
  letter-spacing: -0.055em;
  text-shadow: 0 0.035em 0 hsl(var(--brand-light) / 0.9), 0 0.09em 0.2em rgb(0 0 0 / 0.8);
}

html[data-game-art-style="arcade"] .game-art-hero-title,
html[data-game-art-style="arcade"] .game-art-cta-title,
html[data-game-art-style="arcade"] .game-art-wordmark,
html[data-game-art-style="arcade"] .game-art-cover-title {
  font-family: "Lucida Console", Consolas, ui-monospace, monospace;
  font-style: normal;
  font-weight: 900;
  letter-spacing: 0.015em;
  text-shadow: 0.045em 0.045em 0 hsl(var(--brand-light)), 0.09em 0.09em 0 rgb(9 18 35 / 0.9);
}

html[data-game-art-style="gothic"] .game-art-hero-title,
html[data-game-art-style="gothic"] .game-art-cta-title,
html[data-game-art-style="gothic"] .game-art-wordmark,
html[data-game-art-style="gothic"] .game-art-cover-title {
  font-family: Georgia, "Times New Roman", serif;
  font-style: normal;
  font-weight: 700;
  letter-spacing: -0.025em;
  text-shadow: 0 0.06em 0.16em rgb(0 0 0 / 0.82), 0 0.025em 0 hsl(var(--brand-light) / 0.75);
}

html[data-game-art-style="playful"] .game-art-hero-title,
html[data-game-art-style="playful"] .game-art-cta-title,
html[data-game-art-style="playful"] .game-art-wordmark,
html[data-game-art-style="playful"] .game-art-cover-title {
  font-family: "Arial Rounded MT Bold", "Trebuchet MS", ui-sans-serif, system-ui, sans-serif;
  font-style: italic;
  font-weight: 900;
  letter-spacing: -0.035em;
  text-shadow: 0.035em 0.035em 0 hsl(var(--brand-light)), 0 0.1em 0.2em rgb(0 0 0 / 0.82);
}

header .game-art-wordmark {
  color: hsl(var(--foreground));
  text-shadow: 0 0.035em 0 hsl(var(--background) / 0.45);
}

.game-art-cover-title { font-size: 1.08em; }

#main.home-wide .game-art-hero-copy {
  display: grid;
  gap: 0.7rem;
  font-family: "Trebuchet MS", ui-sans-serif, system-ui, sans-serif;
}

#main.home-wide .game-art-hero-copy__item {
  display: grid;
  gap: 0.35rem;
  padding: 0.25rem 0;
  line-height: 1.48;
  text-shadow: 0 0.07em 0.2em rgb(0 0 0 / 0.88);
}

#main.home-wide .game-art-hero-copy__label {
  width: fit-content;
  color: #fff1cd;
  font-size: 1em;
  font-weight: 700;
  letter-spacing: 0.015em;
  text-shadow: 0 0.06em 0.14em rgb(0 0 0 / 0.92);
}

html[data-game-art-style="poster"] .game-art-hero-copy__label {
  font-family: "Arial Black", "Trebuchet MS", ui-sans-serif, system-ui, sans-serif;
  font-style: normal;
  letter-spacing: -0.025em;
}

html[data-game-art-style="arcade"] .game-art-hero-copy__label {
  font-family: "Lucida Console", Consolas, ui-monospace, monospace;
  font-style: normal;
  letter-spacing: 0.015em;
}

html[data-game-art-style="gothic"] .game-art-hero-copy__label {
  font-family: Georgia, "Times New Roman", serif;
  font-style: italic;
  font-variant: small-caps;
  letter-spacing: 0.035em;
}

html[data-game-art-style="playful"] .game-art-hero-copy__label {
  font-family: "Arial Rounded MT Bold", "Trebuchet MS", ui-sans-serif, system-ui, sans-serif;
  font-style: italic;
  letter-spacing: 0.01em;
}

#main.home-wide .game-art-hero-copy__text {
  color: rgb(255 255 255 / 0.97);
  font-size: 1em;
  font-weight: 400;
  letter-spacing: 0.005em;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

#main.home-wide .home-hero-backdrop::before {
  background-image: url('/images/hero.webp');
  filter: saturate(1.05);
  opacity: 1;
}

#main.home-wide .home-hero-backdrop::after {
  display: block;
  background: linear-gradient(90deg, rgb(6 14 25 / 0.78) 0%, rgb(6 14 25 / 0.58) 48%, rgb(6 14 25 / 0.18) 100%), linear-gradient(0deg, rgb(6 14 25 / 0.3), transparent 60%);
}

#main.home-wide .game-art-cta-title { width: 100%; margin-inline: auto; text-align: center; font-size: clamp(2.2rem, 3vw, 3rem); }
#main.home-wide .game-art-cta-description { font-size: 0.95rem; font-weight: 400; line-height: 1.5; }

#main.home-wide .home-closing-cta-slide { background: transparent; }
#main.home-wide .home-closing-cta-slide img { object-fit: cover; object-position: center; transform: none; }
${markerEnd}`;
let globalStyles = read(stylesPath);
const startIndex = globalStyles.indexOf(markerStart);
if (startIndex >= 0) {
  const firstEnd = globalStyles.indexOf(markerEnd, startIndex);
  if (firstEnd < 0) throw new Error('Art typography CSS start marker has no matching end marker.');
  let suffix = globalStyles.slice(firstEnd + markerEnd.length);
  while (suffix.includes(markerStart)) {
    const duplicateStart = suffix.indexOf(markerStart);
    const duplicateEnd = suffix.indexOf(markerEnd, duplicateStart);
    if (duplicateEnd < 0) throw new Error('Duplicate art typography CSS block is incomplete.');
    suffix = suffix.slice(0, duplicateStart) + suffix.slice(duplicateEnd + markerEnd.length);
  }
  globalStyles = `${globalStyles.slice(0, startIndex)}${css}${suffix}`;
} else if (globalStyles.includes(markerEnd)) {
  throw new Error('Art typography CSS end marker has no matching start marker.');
} else {
  globalStyles = `${globalStyles.trimEnd()}\n\n${css}\n`;
}
write(stylesPath, globalStyles);

console.log(`Applied reusable ${style} art typography to shared game-site components.`);
