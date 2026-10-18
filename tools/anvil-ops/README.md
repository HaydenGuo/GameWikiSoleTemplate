# anvil-ops

Operations CLI and MCP server for GameWikiSoleTemplate sites. Commands include `doctor`, `metrics`, `audit`, `insights`, `submit`, `sites`, and `mcp`.

## Configuration

Add `SITE_URL=https://your-domain` to the site repository's local `.env` file. For Google Search Console features, also configure `GSC_SERVICE_ACCOUNT_JSON` in the local operations `.env`. Keep credentials out of source control. Deployment values belong in Vercel project environment settings.

## Metrics and insights

`metrics` reads Google Search Console clicks, impressions, CTR, position, pages, and queries. `insights` derives SEO actions from Search Console data and stale-code audits. If Search Console credentials are missing, the tool reports the missing setup without inventing traffic metrics.

## Commands

- `doctor` checks the site URL, GitHub CLI, and Search Console access.
- `metrics` collects Search Console metrics for a selected period.
- `insights` generates prioritized SEO actions and stale-code findings.
- `submit` creates a branch and pull request for review.
- `sites` manages the local multi-site registry.
- `mcp` exposes the operations through a stdio MCP server.
