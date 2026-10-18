# Multi-site Operations

Each game wiki remains an independent GitHub repository connected to its own Vercel project. The optional `anvil-ops` registry helps maintainers select local checkouts for routine audits and pull-request preparation; it does not combine deployments or credentials.

## Local registry

Register each checkout with `anvil-ops sites add`, choose a default site, and use `anvil-ops sites list` to review entries. The registry stores local paths and optional URL overrides. Keep credentials in each repository's ignored `.env` file and deployment values in the matching Vercel project settings.

## Analytics and maintenance

The toolkit reads Google Search Console when a site has a valid service-account credential and property access. Run `anvil-ops doctor` before metrics or insights. Without Search Console access, content checks and stale-code review remain available, while traffic-based conclusions are omitted.

## Safe publishing

The submit flow validates local changes, creates a branch, and opens a pull request. Review the diff and CI results before merging. Each repository's connected Vercel project manages its own preview and production deployments.
