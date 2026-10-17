## Summary

<!-- One or two sentences: what does this PR change? -->

## Changes

<!-- Bullet list of the concrete changes. -->

-

## Change class

Choose exactly one primary class:

- [ ] Architecture — boundaries, contracts, dependencies, routing, data flow, or build/deployment structure
- [ ] Behavior — runtime, UI, script, validation, or initializer behavior
- [ ] Format-only — formatting or whitespace changes with no semantic changes
- [ ] Config/content — settings, locale data, copy, assets, or example articles
- [ ] Docs/process — instructions, contribution workflow, PR template, or CI governance

## Scope

<!-- List the intended paths or modules. Explain any additions outside that scope. -->

-

<!-- If this PR necessarily combines classes, explain the dependency and why they cannot be reviewed or shipped separately. -->

## Architecture impact

<!-- For architecture changes: current boundary → target boundary, affected callers/contracts, and compatibility or migration impact. Otherwise write N/A. -->

## Separation check

- [ ] This PR contains one primary change class, or explains a necessary dependency above
- [ ] Format-only changes are separated from behavior, architecture, and config/content changes
- [ ] Formatting tools were limited to the scoped files; no unrelated file-wide formatting was introduced
- [ ] Pre-existing and unrelated working-tree changes are excluded

## Type of product change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change (would require a migration / major version bump)
- [ ] Documentation only
- [ ] Refactor (no functional change)

## Checklist

- [ ] `pnpm typecheck` passes (0 errors)
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] I tested the change locally with `pnpm dev`
- [ ] Docs updated if user-facing change (README / docs/*)
- [ ] Changed paths and diff were reviewed against the stated scope

## Notes for reviewer

<!-- Anything you want the reviewer to pay attention to. -->
