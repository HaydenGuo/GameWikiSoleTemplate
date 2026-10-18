# Game-Specific Brand Mark Workflow

Every game site needs an original symbol that reflects that game's world. The mark is the single source for the site header, browser favicon, search favicon, and mobile/PWA icons.

## Create the source mark

Before running `pnpm gen-assets`, identify the game's visual direction:

1. Read the game's official site or store page and the site's `src/config/site.ts` for its title, platform, genre, and theme colors.
2. Choose one recognizable motif grounded in the game itself: a signature object, creature silhouette, emblematic environment shape, or mechanic. Do not infer lore or copy an official logo. If the game's visual identity is unclear, ask the site owner for a motif.
3. Use an image-generation model to create an original square icon: one central silhouette, strong contrast, a restrained palette that fits the site's theme, and enough clear space around the edges. It must read at 16×16 and 32×32 pixels.
4. Reject results that are only a colored tile with a letter or initial, or that contain words, numbers, a watermark, a screenshot, a detailed scene, thin lines, or tiny decorative details. Generate another version with a simpler silhouette when it fails the small-size check.
5. Save the selected original image to `src/assets/branding/brand-mark.png`. It must be PNG, square, and at least 512×512. A transparent background is preferred; a simple deliberate background is acceptable when it improves contrast.

Suggested image-generation prompt:

> Create an original, premium game-wiki brand symbol for **[game]**, a **[verified genre/platform]** game. Build the icon around **[verified motif]**, using **[theme colors]**. Use a bold, simple silhouette, balanced centered composition, clean vector-like edges, strong light/dark contrast, and generous safe margins. It must remain recognizable at 16×16 pixels. Square 1024×1024 PNG, transparent background. No text, letters, initials, numbers, watermark, screenshot, official logo, or unrelated generic badge.

Replace every bracketed field with researched or user-provided information. Never submit the bracketed template as-is.

## Derive and inspect the site icons

Run:

```powershell
pnpm gen-assets --force
pnpm check-config
```

The generator derives `public/brand-mark-512.png`, browser/search favicons, Apple and Android/PWA icons, and the homepage share image from the source mark. It does not invent artwork from the game name; artwork generation and size inspection are required before this step.

`pnpm check-config` compares the generated header, PNG, and ICO icon pixels with the normalized source mark. If the source changed but generation was skipped, the check fails with a `pnpm gen-assets --force` instruction.

Open `public/favicon-16x16.png`, `public/favicon-32x32.png`, and `public/favicon-48x48.png`. If the motif collapses or loses contrast at small sizes, simplify/regenerate the source and rerun the command. Do not deploy until the header image and favicon outputs are from the selected mark.

## Google Search favicon

The homepage declares the 48×48 PNG and the ICO fallback. Keep both URLs stable, and make sure the homepage and icon files are crawlable. Google may take several days or weeks to recrawl and process the icon, and it does not guarantee that an eligible favicon will appear. After deployment, inspect the homepage and favicon URLs and request homepage recrawling through Search Console when appropriate.
