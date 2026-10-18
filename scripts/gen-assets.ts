/**
 * gen-assets — generate the favicon set from the AI-created brand mark + hero image.
 *
 * Usage:
 *   pnpm gen-assets            # regenerate assets whose inputs changed
 *   pnpm gen-assets --force    # ignore the cache manifest
 *
 * What it writes (IN PLACE, same filenames the template already references —
 * zero code changes needed; the fork lesson this closes: shipping the demo
 * anvil favicon to production because binary assets were "manual, later"):
 *   public/favicon.svg                    stable SVG wrapper for the brand mark
 *   public/favicon-16x16.png              ┐
 *   public/favicon-32x32.png              │ resized from the required
 *   public/apple-touch-icon.png (180)     │ AI-created square brand mark
 *   public/android-chrome-192x192.png     │
 *   public/android-chrome-512x512.png     ┘
 *   public/images/hero.webp (1200×630)    brand gradient + site name (og default)
 *   public/manifest.json theme_color      synced to the live brand color
 *
 * The source mark lives in src/assets/branding/brand-mark.png. It must be a
 * square, text-free, high-resolution mark created for the current game site.
 *
 * favicon.ico is regenerated as a standards-compatible ICO containing the
 * generated 32px PNG. This keeps conventional crawlers that request
 * /favicon.ico from receiving a stale demo icon.
 *
 * Cache: node_modules/.cache/gen-assets/manifest.json (stableHash of inputs;
 * cache lives OUTSIDE public/ so nothing extra ever ships to production).
 * Unchanged entries are skipped.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import subsetFont from 'subset-font';
import { site } from '~/config/site';
import { hslToHex, hasCjk, parseBrandHsl, stableHash, stripEmoji, subsetText } from '~/lib/brand-utils';
import { createNormalizedBrandMark, resizeBrandMark } from './lib/brand-mark';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(root, 'public');
const BRAND_SOURCE = join(root, 'src/assets/branding/brand-mark.png');
const FONT_CACHE = join(root, 'node_modules/.cache/gen-assets/fonts');
const MANIFEST_VERSION = 1;
const FORCE = process.argv.includes('--force');

const NOTO_BASE = 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF';

/** Contrast-safe text color on a brand-colored square (WCAG-ish luminance). */
function textColorOn(brandHsl: { h: number; s: number; l: number }): string {
  return brandHsl.l > 60 ? '#111827' : '#ffffff';
}

async function fontsFor(text: string) {
  const latin = (
    [
      ['Lato-Regular.ttf', 400],
      ['Lato-Bold.ttf', 700],
    ] as const
  ).map(([file, weight]) => ({
    name: 'Lato',
    data: readFileSync(join(root, 'scripts/fonts', file)),
    weight,
    style: 'normal' as const,
  }));
  if (!hasCjk(text)) return latin;

  // A single CJK initial: Noto Sans CJK SC covers han + kana glyphs alike.
  const file = 'NotoSansCJKsc-Regular.otf';
  let otf: Buffer | null = null;
  for (const dir of [join(root, 'scripts/fonts'), FONT_CACHE]) {
    const p = join(dir, file);
    if (existsSync(p)) {
      otf = readFileSync(p);
      break;
    }
  }
  if (!otf) {
    const url = `${NOTO_BASE}/SimplifiedChinese/${file}`;
    console.log('  downloading NotoSansCJKsc-Regular.otf (~16MB, cached for future runs) …');
    const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}. Offline? Pre-download the OTF into scripts/fonts/.`);
    otf = Buffer.from(await res.arrayBuffer());
    mkdirSync(FONT_CACHE, { recursive: true });
    writeFileSync(join(FONT_CACHE, file), otf);
  }
  return [
    ...latin,
    {
      name: 'Noto Sans CJK SC',
      data: await subsetFont(otf, subsetText(text), { targetFormat: 'sfnt' }),
      weight: 400 as const,
      style: 'normal' as const,
    },
  ];
}

async function renderPng(element: unknown, width: number, height: number, fonts: unknown[]) {
  const svg = await satori(element as never, {
    width,
    height,
    fonts: fonts as never,
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

/** Wrap a PNG payload in a minimal ICO container (one 32×32 image). */
function pngToIco(png: Buffer): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type
  header.writeUInt16LE(1, 4); // image count

  const directory = Buffer.alloc(16);
  directory.writeUInt8(32, 0); // width
  directory.writeUInt8(32, 1); // height
  directory.writeUInt8(0, 2); // palette
  directory.writeUInt8(0, 3); // reserved
  directory.writeUInt16LE(1, 4); // color planes
  directory.writeUInt16LE(32, 6); // bits per pixel
  directory.writeUInt32LE(png.length, 8);
  directory.writeUInt32LE(header.length + directory.length, 12);

  return Buffer.concat([header, directory, png]);
}

async function main() {
  const css = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');
  const brand = parseBrandHsl(css);
  if (!brand) {
    console.error('❌ could not parse --brand from src/styles/globals.css');
    process.exit(1);
  }
  const brandHex = hslToHex(brand.h, brand.s, brand.l);
  const brandDeep = hslToHex(brand.h, brand.s, Math.max(brand.l - 18, 12));
  const ink = textColorOn(brand);

  const gameName = stripEmoji(site.game.name).trim() || site.name;
  const heroTitle = stripEmoji(site.name).trim();

  const manifestPath = join(root, 'node_modules/.cache/gen-assets/manifest.json');
  mkdirSync(dirname(manifestPath), { recursive: true });
  const manifest: Record<string, string> = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf8'))
    : {};
  const cacheKey = (name: string, ...inputs: string[]) =>
    stableHash(`${MANIFEST_VERSION}|${name}|${inputs.join('|')}`);
  const fresh = (name: string, hash: string) => FORCE || manifest[name] !== hash;

  if (!existsSync(BRAND_SOURCE)) {
    throw new Error(
      `Missing AI-created brand mark: ${BRAND_SOURCE}. Generate a text-free square mark for this game before running pnpm gen-assets.`,
    );
  }
  const brandSource = sharp(BRAND_SOURCE);
  const brandMetadata = await brandSource.metadata();
  if (!brandMetadata.width || !brandMetadata.height || brandMetadata.width < 512 || brandMetadata.height < 512) {
    throw new Error(`Brand mark must be at least 512×512; received ${brandMetadata.width ?? 0}×${brandMetadata.height ?? 0}.`);
  }
  if (brandMetadata.width !== brandMetadata.height) {
    throw new Error(`Brand mark must be square; received ${brandMetadata.width}×${brandMetadata.height}.`);
  }

  console.log(`\n🎨 gen-assets — brand ${brandHex}, AI brand mark ${brandMetadata.width}×${brandMetadata.height}\n`);

  // 1. Normalize the AI-created mark once. Trim excess transparent canvas,
  //    then restore a 6.25% safe margin so the silhouette survives masking.
  const normalizedMark = await createNormalizedBrandMark(BRAND_SOURCE);
  const markHash = cacheKey('brand-mark', readFileSync(BRAND_SOURCE).toString('base64'));

  // 2. favicon.svg — stable URL with the AI-created PNG mark as its image.
  const svgHash = cacheKey('favicon.svg', markHash);
  if (fresh('favicon.svg', svgHash)) {
    writeFileSync(
      join(PUBLIC, 'favicon.svg'),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><image href="/brand-mark-512.png" width="512" height="512" preserveAspectRatio="xMidYMid meet"/></svg>\n`,
    );
    manifest['favicon.svg'] = svgHash;
    console.log('  ✅ public/favicon.svg');
  }

  // 3. PNG favicons — resize the same AI-created mark for every surface.
  const pngHash = cacheKey('favicon-png', markHash);
  if (fresh('favicon-png', pngHash)) {
    const png512 = normalizedMark;
    writeFileSync(join(PUBLIC, 'brand-mark-512.png'), png512);
    console.log('  ✅ public/brand-mark-512.png (512×512)');
    const sizes: Array<[string, number]> = [
      ['favicon-16x16.png', 16],
      ['favicon-32x32.png', 32],
      ['favicon-48x48.png', 48],
      ['apple-touch-icon.png', 180],
      ['android-chrome-192x192.png', 192],
      ['android-chrome-512x512.png', 512],
    ];
    for (const [name, size] of sizes) {
      const buf = await resizeBrandMark(png512, size);
      writeFileSync(join(PUBLIC, name), buf);
      console.log(`  ✅ public/${name} (${size}×${size})`);
    }
    writeFileSync(join(PUBLIC, 'favicon.ico'), pngToIco(await resizeBrandMark(png512, 32)));
    console.log('  ✅ public/favicon.ico (32×32 ICO)');
    manifest['favicon-png'] = pngHash;
  }

  // 3. hero.webp — 1200×630 brand gradient + site name (the default og:image).
  const heroHash = cacheKey('hero.webp', brandHex, brandDeep, heroTitle);
  if (fresh('hero.webp', heroHash)) {
    const fonts = await fontsFor(heroTitle + gameName);
    const png = await renderPng(
      {
        type: 'div',
        props: {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: `linear-gradient(135deg, ${brandHex} 0%, ${brandDeep} 100%)`,
            color: ink,
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 88,
                  fontWeight: 700,
                  fontFamily: hasCjk(heroTitle) ? 'Noto Sans CJK SC' : 'Lato',
                  textAlign: 'center',
                  padding: '0 60px',
                },
                children: heroTitle,
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 34,
                  marginTop: 24,
                  fontFamily: hasCjk(gameName) ? 'Noto Sans CJK SC' : 'Lato',
                  opacity: 0.85,
                },
                children: gameName,
              },
            },
          ],
        },
      },
      1200,
      630,
      fonts,
    );
    mkdirSync(join(PUBLIC, 'images'), { recursive: true });
    writeFileSync(join(PUBLIC, 'images/hero.webp'), await sharp(png).webp({ quality: 90 }).toBuffer());
    manifest['hero.webp'] = heroHash;
    console.log('  ✅ public/images/hero.webp (1200×630)');
  }

  // 4. manifest.json theme_color — keep the PWA color glued to the live brand.
  const manifestJsonPath = join(PUBLIC, 'manifest.json');
  const manifestJson = JSON.parse(readFileSync(manifestJsonPath, 'utf8'));
  if ((manifestJson.theme_color ?? '').toLowerCase() !== brandHex.toLowerCase()) {
    manifestJson.theme_color = brandHex;
    writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + '\n');
    console.log(`  ✅ public/manifest.json theme_color → ${brandHex}`);
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log('\n✅ Done. All favicon formats were regenerated from the current site identity.\n');
}

main();
