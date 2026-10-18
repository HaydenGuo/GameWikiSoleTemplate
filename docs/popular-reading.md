# Popular and Most Read

Popular / Most Read is optional. With `PUBLIC_POPULAR_ENABLED=false` or unset, article pages do not send view requests and the homepage does not call the Popular API. It renders the newest published article links as a static fallback.

## Enable it

1. Create a Neon Postgres database for this site.
2. Run `migrations/0001_article_views_daily.sql` in the Neon SQL Editor.
3. Add `DATABASE_URL` to the Vercel project environment. Keep this value server-side and do not expose it with a `PUBLIC_` prefix.
4. Set `PUBLIC_POPULAR_ENABLED=true` for the environments where the feature should be active, then redeploy.
5. Verify `POST /api/article-view` and `GET /api/popular?days=7&limit=3`.

Vercel Functions expose the API routes from the root `api/` directory. The write endpoint accepts only canonical paths from the generated published-article allow-list. It records one daily count per article. The read endpoint returns counts for a bounded 1–30 day window and filters out paths no longer in the published allow-list.

When `DATABASE_URL` is missing or the database cannot be reached, the API returns `503`; the page keeps its static fallback. Do not report database-backed rankings as available until the deployed endpoints have been checked.

## Local verification

Use `pnpm dev:vercel` to run Vercel's local development server. Configure a development-only `DATABASE_URL` in `.env.local` when verifying database writes. Do not use production credentials in local files.

```powershell
Invoke-WebRequest https://your-domain.wiki/api/article-view -Method Post -ContentType 'application/json' -Body '{"slug":"/guides/beginner-guide/"}'
Invoke-RestMethod 'https://your-domain.wiki/api/popular?days=7&limit=3'
```

The view endpoint returns `204` for a valid published article path; the ranking endpoint returns an array of `{ "slug": "...", "views": 1 }` items.
