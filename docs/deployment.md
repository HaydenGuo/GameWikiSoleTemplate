# Deploy to Vercel

GameWikiSoleTemplate uses a static-first Astro build, Vercel Functions for the optional same-origin APIs, and Neon Postgres for optional Popular / Most Read statistics. The standard path is GitHub → Vercel. Hosting does not require a Cloudflare account or Wrangler setup; Cloudflare Web Analytics remains an optional, independent analytics integration.

## Before you deploy

- A GitHub repository containing the initialized site.
- A Vercel account with access to that repository.
- Node.js 22.13+ and pnpm 11.1.1 for local development.
- A domain, if you want to use a custom domain.

Keep one writable checkout for each site. Preview deployments are tied to GitHub branches and pull requests; do not run parallel production deployments from separate checkouts.

## Connect GitHub to Vercel

1. Push the initialized site to GitHub.
2. In Vercel, choose **Add New → Project**, import the repository, and select the production branch (normally `main`).
3. Keep the Astro framework preset and confirm the project root is the repository root.
4. Use the repository's pinned package manager. The build command is `pnpm build`; Astro writes the static site to `dist/`. The root `api/` directory is deployed as Vercel Functions alongside the static output.
5. Add the environment variables below to the Vercel project. Set `SITE_URL` to the canonical HTTPS URL for the deployment.
6. Deploy. Vercel creates preview deployments for branches and pull requests and a production deployment from the configured production branch.

Do not change the Vercel build command to a Cloudflare or Wrangler command. Do not add `wrangler.toml` to a fork.

## Custom domain

1. Add the exact domain to the Vercel project under **Settings → Domains**.
2. Use the DNS records Vercel displays for that domain. Add those records at the DNS provider currently authoritative for the domain. The registrar and DNS provider may differ.
3. Keep existing mail, verification, and other DNS records. Change nameservers only as a separately planned DNS migration.
4. Wait for Vercel to confirm the domain and TLS certificate.
5. Set `SITE_URL` to the canonical HTTPS domain in the Vercel Production environment and redeploy.
6. Verify the canonical host, redirect behavior, `robots.txt`, and `sitemap-index.xml`.

Never copy example DNS targets from another project. Use the values shown in this Vercel project's domain settings.

## Environment variables

Copy `.env.example` to `.env.local` for local use, then set the same values in Vercel project settings for the required environments. `.env.local` is ignored by Git; do not commit credentials.

| Variable | Required | Purpose |
|---|---:|---|
| `SITE_URL` | Yes | Canonical HTTPS origin used by sitemap and metadata. |
| `PUBLIC_POPULAR_ENABLED` | No | Set to `true` to enable article-view requests and Popular API requests. Defaults to `false`. |
| `DATABASE_URL` | Only for Popular | Neon Postgres connection string. Keep it server-side; do not prefix it with `PUBLIC_`. |
| `PUBLIC_GISCUS_REPO`, `PUBLIC_GISCUS_REPO_ID`, `PUBLIC_GISCUS_CATEGORY`, `PUBLIC_GISCUS_CATEGORY_ID` | No | Enable Giscus comments when all values are configured. |
| `PUBLIC_SPONSOR_URL`, `PUBLIC_SPONSOR_IMAGE_URL` | No | Optional sponsor card. |
| `PUBLIC_ADSENSE_CLIENT`, `PUBLIC_ADSENSE_SLOT_*` | No | Optional AdSense client and placements. |
| `PUBLIC_GA_ID` | No | Optional Google Analytics measurement ID; loaded after consent. |
| `PUBLIC_CF_BEACON_TOKEN` | No | Optional cookieless Cloudflare Web Analytics beacon; independent from hosting. |
| `PUBLIC_GSC_VERIFICATION` | No | Google Search Console meta verification value. |

## Optional Popular / Most Read database

The site stays static and renders truthful newest-article links when this feature is disabled. To enable it:

1. Create a Neon Postgres database for this site.
2. Run [`migrations/0001_article_views_daily.sql`](../migrations/0001_article_views_daily.sql) in the Neon SQL Editor.
3. Set `PUBLIC_POPULAR_ENABLED=true` and `DATABASE_URL` in the Vercel project for Production and Preview as appropriate.
4. Redeploy and verify `POST /api/article-view` and `GET /api/popular?days=7&limit=3` on the deployed site.

The API accepts only canonical paths generated from published English articles. Requests fail safely when the database is not configured; the static site remains usable. Use a separate database per site and monitor database usage in Neon.

## Local development

- `pnpm dev` runs the Astro page server for regular content and style work.
- `pnpm dev:vercel` runs Vercel's local development server without linking a Vercel project and exercises the `/api/*` Functions alongside the pages. The Vercel CLI uses the `dev` script as its framework server, so naming `vercel dev` itself as `dev` causes recursive invocation.
- `pnpm build` checks the static production build.
- Use `.env.local` for local environment values. Do not copy production secrets into tracked files.

## After deployment

Check the canonical homepage and a representative article, open the generated sitemap, and verify each enabled API route. Confirm that disabled integrations remain absent and that optional API failures do not hide the static article links or other page content.
