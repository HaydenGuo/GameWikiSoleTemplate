---
title: "Dev 2 · Select Categories and Add Languages"
description: "Choose from the template's fixed navigation categories and add languages with a scaffold plus translation prompts. A lookup manual."
manual: dev
order: 2
icon: lucide:folder-tree
tldr: "Navigation uses eight fixed categories in a fixed order; pnpm apply-template lets you enable only the categories the game supports, and rejects custom keys. Adding a language = run pnpm new-locale for the skeleton, then AI translates the UI against the English JSON and the articles one by one (codes are never translated). The switcher only lists languages that really have content."
updated: 2026-08-17
---

## Where you are now and what this chapter solves

Sooner or later after launch you'll want to select the right content categories, or ship a Japanese version. This chapter turns each of those two tasks into a fixed recipe — follow it and you can't go wrong. **A lookup manual: jump to the section you need.**

## Request 1: Select navigation categories

The template owns eight category keys and their order:

```text
guides → builds → items → maps → bosses → tier-list → news → codes
```

Run `pnpm apply-template` and enter a comma-separated subset of those keys. The command keeps the selected categories in the fixed order, ignores unsupported keys, and generates the matching locale labels and overview metadata. Do not edit `navigation.ts` to invent a new category; if the game does not support a category, leave it unselected.

Ask AI to choose categories with this prompt:

```text
Review this game and choose only supported AnvilWiki navigation categories from:
guides, builds, items, maps, bosses, tier-list, news, codes.
Use the category definitions in docs/apply-template.md. Return the selected keys
in the template's fixed order, with one sentence of evidence for each selected
category and one sentence explaining each omitted category. Do not invent keys
and do not reorder the list.
```

## Request 2: Add a language (Japanese as the example)

Language three-place consistency: the language list config = the locale JSON files = the content directories.

```bash
# Step 1: run the scaffold (it asks for the language code, e.g. ja) — it generates the JSON skeleton and the content directory
pnpm new-locale
```

Step 2 — have AI translate the interface text (copy the whole block):

```text
I just added <language-code> with pnpm new-locale. Translate that language file:
translate src/locales/<language-code>.json key by key against src/locales/en.json,
do not add or remove keys; keep category keys consistent with navigation.ts.
Run pnpm check-config && pnpm check-i18n to verify — only all-green counts as done.
```

Step 3 — translate the articles (one at a time):

```text
Translate src/content/wiki/en/<category>/<slug>.mdx into <target-language> and
write it to the same path under src/content/wiki/<target-language>/. Rules: translate only
title/description/summary and the body; leave slug, dates, internal link paths, and the
code field of codes entries untouched; keep tags in English when no equivalent exists;
draft a glossary first so terminology stays consistent throughout. When done, run
pnpm check-content && pnpm build && pnpm check-i18n — only all-green counts as done.
```

Note: the codes themselves (the `code` field) are never translated — they are alphanumeric strings shared worldwide.

**The language switcher only lists languages that really have content** — while Japanese has zero articles, Japanese won't appear in the switcher. This prevents tap-into-a-blank-page moments.

## If you get stuck

- **"check-config reports a category mismatch"**: its output names exactly which of the three places doesn't line up — fill in what's missing.
- **"The build broke after translating articles into the new language"**: nine times out of ten a registration-card field got mangled during translation (a stray period in a date, that kind of thing); look at the exact file and line in the build error.

## ✅ Acceptance criteria (check the tasks you did)

- ☐ Selected categories: only fixed keys are enabled, fixed order is preserved, and each enabled category has real content
- ☐ Added a language: `pnpm check-i18n` reports nothing missing, the new language appears in the switcher

## Next steps

Customizations beyond categories and languages — changing the theme color, editing homepage copy, adding new article fields — are in [Dev 3 · change the theme color and edit the homepage](/landing/docs/theme-and-homepage).
