---
title: "Dev 7 · Operate Your Wiki with an AI Assistant"
description: "Use anvil-ops for health checks, Search Console metrics, prioritized content actions, and pull-request publishing."
manual: dev
order: 7
icon: lucide:bot
tldr: "anvil-ops checks the site setup, reads Google Search Console data, highlights content actions, and can prepare pull requests for review. Configure SITE_URL and any Search Console credentials in a local .env file; deployment values belong in Vercel project settings."
updated: 2026-10-18
---

## What the operations toolkit does

`anvil-ops` is an optional CLI and MCP companion for GameWikiSoleTemplate. It can check the local site configuration, retrieve Google Search Console metrics, identify SEO and stale-code actions, and prepare a branch and pull request. Changes go through review before they are merged.

## Configure the site

Add `SITE_URL=https://your-domain` to the site's local `.env` file. The file is ignored by Git. To use Search Console metrics, add a Google service-account JSON key as `GSC_SERVICE_ACCOUNT_JSON` and grant that service account access to the correct Search Console property. Keep private keys out of source files and pull requests.

## Check and read the site

Run the health check from the repository root:

```sh
npx anvilwiki-ops doctor
```

When Search Console is configured, collect a report and prioritized actions:

```sh
npx anvilwiki-ops metrics --days 28 --format md
npx anvilwiki-ops insights
```

Metrics include Search Console clicks, impressions, CTR, average position, pages, and queries. Insights add evidence-backed recommendations and stale-code checks. If credentials are not configured, the tool reports that state instead of presenting fabricated traffic data.

## Connect an MCP client

Register `npx anvilwiki-ops mcp` as a stdio MCP server in the client configuration. The available tools include `doctor`, `metrics`, `audit`, `insights`, and `submit_pr`. Review the proposed changes and pull request before merging.

## Troubleshooting

- A missing `SITE_URL` means the local `.env` does not identify the site. Set its canonical HTTPS URL and retry.
- A failed Search Console access check means the service account has not been granted access to the matching property, or the credential file is invalid.
- A missing GitHub CLI prevents pull-request submission; install and authenticate `gh` before using that command.
- A clean repository has no changes to submit; create and validate the content changes first.
