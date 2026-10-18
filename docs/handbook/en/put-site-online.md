---
title: "Chapter 5 · Put Your Site Online with GitHub and Vercel"
description: "Connect the site repository to Vercel, configure its build and environment, and bind a custom domain using the records Vercel provides."
manual: learn
order: 5
icon: lucide:cloud-upload
tldr: "Push the site to GitHub, import that repository into Vercel, and deploy. Add any custom domain in Vercel, publish the exact DNS records it shows at your authoritative DNS provider, then verify the canonical URL and sitemap."
updated: 2026-10-18
---

## What this chapter does

Your site is ready in the repository; now make it reachable on the public web. The publishing route is GitHub → Vercel. Astro generates static pages, and the root `api/` directory supplies optional same-origin Vercel Functions.

## Step 1: Push the repository to GitHub

If your repository is already on GitHub, push the reviewed changes to its production branch. Otherwise, create a GitHub repository and push the site there. Keep `.env.local`, database connection strings, and other credentials out of Git.

## Step 2: Import it into Vercel

1. In Vercel, choose **Add New → Project** and import the GitHub repository.
2. Select the production branch, usually `main`, and keep the repository root as the project root.
3. Use the Astro framework preset and the pinned package manager from `package.json`.
4. Confirm the build command is `pnpm build` and the static output is `dist/`.
5. Set `SITE_URL` to the deployment's canonical HTTPS URL in the Vercel project environment.
6. Deploy. Pull requests and branches get preview deployments; the production branch gets the production deployment.

Vercel detects the static Astro site and the root `api/` Functions.

## Step 3: Bind your custom domain

1. Add the domain in the Vercel project under **Settings → Domains**.
2. Copy the exact DNS records Vercel requests. Add them at the DNS provider currently authoritative for your domain; this may differ from the registrar where you bought it.
3. Preserve existing mail, ownership-verification, and other records. Do not change nameservers as part of adding one website record.
4. Wait until Vercel reports the domain as valid and its TLS certificate as ready.
5. Set production `SITE_URL` to the canonical HTTPS domain and redeploy.

Use the records shown for this Vercel project. DNS targets can vary by domain and account; examples from another project are not authoritative.

## Step 4: Verify the live site

- Open the canonical homepage and a representative article.
- Check the canonical URL and redirect behavior for the root and `www` host.
- Open `/robots.txt` and `/sitemap-index.xml`.
- Check `/api/game-deals` and any other API enabled in your site configuration.
- Confirm Vercel shows the deployment as Ready and that it was built from the intended GitHub commit.

## Optional Popular / Most Read

To enable database-backed article views, create a Neon database, run `migrations/0001_article_views_daily.sql`, and configure `DATABASE_URL` plus `PUBLIC_POPULAR_ENABLED=true` in Vercel. See [Popular and Most Read](../../popular-reading.md) for the full setup. The feature is optional; static article links remain available if it is disabled or the database is unavailable.
