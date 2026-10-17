# AnvilWiki Template Snapshot Design

## Purpose

Create a clean, standalone AnvilWiki template snapshot at `D:\HBCodeRepo\GameWebs\template - AnvilWiki`. The snapshot is the starting point for future game-Wiki projects; it is not an existing live site and must not alter the shared Next.js GameWebs template or any deployed game site.

## Included Template Surface

The snapshot retains the complete source and operational surface needed to create and validate a new site:

- `src/` and `public/` for the Astro application, content model, locale files, components, and static assets.
- `.agent/skills/` for article creation, batch drafts, code updates, freshness review, and AdSense review.
- `.github/`, `scripts/`, and `tests/` for deterministic quality gates and template automation.
- `docs/`, `requirements/`, and root configuration files for template setup, content contracts, deployment, and developer guidance.
- `tools/anvil-ops/` for the optional multi-site GSC and Cloudflare operations package.

## Excluded Runtime Surface

The snapshot must not contain source-control history, installed dependencies, generated output, caches, or local secrets. Exclude `.git/`, `node_modules/`, `.astro/`, `dist/`, coverage output, local environment files other than `.env.example`, and runtime logs.

## Acceptance Criteria

1. The target contains the listed source, documentation, automation, and configuration surfaces.
2. The target contains none of the excluded runtime surfaces.
3. The copied root `package.json`, `src/content.config.ts`, `.agent/skills/`, and `.github/workflows/` exist.
4. The copied content Skills and quality-workflow definitions can be discovered by path inspection.

## Non-goals

- Do not install dependencies or build the copied template in this task.
- Do not initialize Git, create a commit, add credentials, or deploy.
- Do not edit `D:\HBCodeRepo\GameWebs\template` or individual live-site directories.
