# Popular / Most Read

The homepage can show the three published articles with the most page views over the last seven UTC days. It counts page views, not unique people: every valid article load increments that article's daily counter. The site stores only a canonical article path and UTC date; it does not store IP addresses, accounts, reading text, or browser identifiers.

## Default: static and self-contained

The default build keeps Popular disabled with `PUBLIC_POPULAR_ENABLED = "false"`. Article pages do not send a view request and the homepage does not call an API. It renders the newest published article links as a truthful local fallback, so a normal Cloudflare Pages static deployment has no database, function, or server setup.

Only the build-generated allow-list of published article paths can be counted when the optional feature is enabled. Drafts, future-dated posts, home pages, category pages, tags, unknown slugs, and external URLs are rejected.

## Optional: Cloudflare Pages Functions + D1

Enable this only when the site needs a rolling Most Read list:

1. Create a Cloudflare D1 database for this game site and run `migrations/0001_article_views_daily.sql` against it.
2. Add the `POPULAR_DB` binding in `wrangler.toml` (or the equivalent Pages project binding). Keep the binding name exactly `POPULAR_DB`.
3. Set `PUBLIC_POPULAR_ENABLED = "true"` in the Pages build environment, then redeploy. The static pages and the optional functions are served from the same hostname.
4. Add a Cloudflare rate-limit rule for `POST /api/article-view`; 60 requests per minute per IP is a practical starting point. This is an abuse-control layer, not identity tracking.

Without the D1 binding, the functions return `503` and the page keeps its static fallback. The function also checks the request method, same-origin `Origin` header, and generated article allow-list before writing.

## Verification after deployment

Use a published article path:

```powershell
Invoke-WebRequest https://your-domain.wiki/api/article-view -Method Post -ContentType 'application/json' -Body '{"slug":"/guides/beginner-guide/"}'
Invoke-RestMethod 'https://your-domain.wiki/api/popular?days=7&limit=3'
```

With the feature enabled and D1 bound, the first command returns HTTP 204. Repeating it raises the page-view total again. The second returns only allowed, published article paths ordered by recent seven-day views. With the default build flag, these requests are intentionally not emitted by the browser.
