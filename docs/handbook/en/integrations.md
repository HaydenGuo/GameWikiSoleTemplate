---
title: "Dev 4 · Configure Optional Integrations"
description: "Configure ads, comments, Google Analytics, Search Console verification, sponsor cards, and optional Neon Popular stats for the Vercel template."
manual: dev
order: 4
icon: lucide:plug
tldr: "Optional features read environment variables and stay disabled when values are empty. Use `.env.local` for local work and Vercel project environment settings for deployments. Keep private connection strings such as DATABASE_URL server-side."
updated: 2026-10-18
---

## One place for deployment settings

Copy `.env.example` to `.env.local` for local development. For deployed environments, add the corresponding values in Vercel under **Project → Settings → Environment Variables**, select Production and/or Preview, then redeploy. `.env.local` is ignored by Git. Never place database connection strings or credentials in public variables.

| Variable | Purpose | Default |
|---|---|---|
| `SITE_URL` | Canonical HTTPS URL used by metadata and sitemap | Set to your domain |
| `PUBLIC_GISCUS_REPO`, `PUBLIC_GISCUS_REPO_ID`, `PUBLIC_GISCUS_CATEGORY`, `PUBLIC_GISCUS_CATEGORY_ID` | Giscus comments; all required | Disabled |
| `PUBLIC_ADSENSE_CLIENT`, `PUBLIC_ADSENSE_SLOT_*` | Google AdSense placements | Disabled |
| `PUBLIC_GA_ID` | Google Analytics; loaded after consent | Disabled |
| `PUBLIC_GSC_VERIFICATION` | Search Console HTML meta verification | Disabled |
| `PUBLIC_SPONSOR_URL`, `PUBLIC_SPONSOR_IMAGE_URL` | Optional sponsor card | Disabled |
| `PUBLIC_POPULAR_ENABLED` | Enables article-view and Popular API requests | `false` |
| `DATABASE_URL` | Server-side Neon Postgres connection for Popular stats | Unset |

## Keep secrets server-side

Astro variables prefixed with `PUBLIC_` are embedded into browser-facing output. Only put non-secret, intentionally public configuration there. `DATABASE_URL` has no `PUBLIC_` prefix and is read by Vercel Functions only. Do not paste it into source files, screenshots, issue comments, or client-side code.

## Enable Popular statistics

Create a Neon database, run `migrations/0001_article_views_daily.sql`, then set `DATABASE_URL` and `PUBLIC_POPULAR_ENABLED=true` in Vercel. If the database is missing or unavailable, the API returns `503` and the static fallback remains visible. See [Popular and Most Read](../../popular-reading.md).

## Local development

Use `pnpm dev` for Astro pages. Use `pnpm dev:vercel` so Vercel CLI serves the pages and API Functions together. The Vercel CLI uses the package `dev` script to start Astro; making that script call `vercel dev` recursively invokes itself.
