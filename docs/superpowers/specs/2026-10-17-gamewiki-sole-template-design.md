# GameWikiSoleTemplate Design

Date: 2026-10-17  
Status: Approved by user; implementation planning in progress  
Approved direction: Merge the current GameWikiCore implementation directly into the existing `src` layout used by GameWikiTemplate.

## Goal

Create a single-source Astro game-wiki starter named **GameWikiSoleTemplate**. It combines the reusable runtime currently maintained in `HaydenGuo/GameWikiCore` with the starter configuration, content, initializer, and operational tooling currently maintained in `HaydenGuo/GameWikiTemplate`.

The resulting starter must install, develop, validate, build, and initialize without a Git dependency on GameWikiCore, a separately versioned Core package, junctions, or a source-link step. Existing Template/Core repositories and deployed game sites remain untouched by this work.

## Baseline and observed constraints

- The current default branches are Template `v1.1.2` and Core `v2.7.2`.
- The Template package currently pins `@hb-game-wiki/template` to `GameWikiCore#v2.7.2`.
- Core owns generic components, routes, shared libraries, i18n helpers, styles, and reusable content/configuration scripts.
- Template owns the starter identity/configuration, example content/assets/locales, `apply-template`, operational workflows, and consumer-side validation.
- Core source imports the `@hb-game-wiki/template/...` namespace internally. Template code and tests also use that namespace, so imports and path aliases must change as part of the merge.
- The two script trees overlap in `check-config.ts`, `check-content.ts`, `check-i18n.ts`, `check-links.ts`, `check-sitemap.ts`, `template-baseline.ts`, and three `scripts/lib` files. These require a source comparison and deliberate reconciliation; copying one tree over the other is not acceptable.
- `src/config/article-template.ts` is byte-identical in the current Template and Core default branches. Preserve it as the unified article contract and keep a test asserting its required regions.
- No GitHub repository named `HaydenGuo/GameWikiSoleTemplate` currently exists.

## Selected architecture

Start from the current GameWikiTemplate default branch. Bring Core-owned source into the matching directories under the same `src` tree (`components`, `pages`, `lib`, `i18n`, and `styles`, plus any generic config contract that survives reconciliation). Use direct local imports or the repository's established `~` alias for internal code. Keep the existing Astro starter layout and its game-specific example inputs in their present locations.

There will be one repository version for the whole template. Core changes will be reviewed and released with the template; game sites will continue to copy/fork the starter and pin their own site code through their existing repositories. This design does not migrate existing sites or remove the old Core repository.

## Dependency and workflow changes

- Remove `@hb-game-wiki/template` from `package.json`, `pnpm-lock.yaml`, and `tsconfig.json` path mappings.
- Remove `template:link`, the junction creation script, and checks that require Core-owned directories to be junctions or require a Core version/tag. Replace them with checks for local source integrity and required content contracts where needed.
- Update lifecycle scripts (`predev`, `prebuild`, `pretypecheck`) so they run the local checks directly and retain the popular-slug manifest generation.
- Preserve `apply-template`, its interactive/answers parity, rerun safety, and real-mode E2E behavior. Remove any E2E setup that links an installed Core package; exercise a clean copy of the unified repository instead.
- Update user/developer docs to describe one source tree and one release/version. Retain deployment, content-format, privacy, contributor, and game-identity boundaries that remain valid.

## Conflict resolution rules

Before migration, compare all overlapping files and import conventions. Preserve Template-specific checks and initializer behavior. Incorporate Core behavior where it adds generic runtime functionality. For duplicate scripts, produce one merged implementation with tests that cover the union of supported contracts. Reconcile the fixed article contract with the existing example content and consumers; do not silently loosen article requirements or remove features. Preserve MIT notices and attribution from both sources.

If a conflict cannot be resolved from existing behavior and documentation, leave it explicitly unresolved for review instead of changing the contract by assumption.

## Out of scope

- Editing `GameWikiTemplate`, `GameWikiCore`, or any game-specific site repository.
- Migrating existing sites to the new starter.
- Changing product identity, navigation/content contracts, article requirements, ads, analytics, or deployment provider.
- Deploying, publishing, changing DNS/provider settings, or merging a pull request.
- Adding new product features unrelated to making the combined source self-contained.

## Acceptance criteria

1. The unified repository contains the current generic Core runtime and the Template starter capabilities, reconciled without deleting unrelated starter behavior.
2. There are no runtime, dev, workspace, path-alias, or build-time dependencies on GameWikiCore or `@hb-game-wiki/template`; no junction/source-link setup remains.
3. A clean dependency install works without private Core package access, and local development, type checks, lint, tests, configuration/content/i18n checks, build, link checks, and initializer E2E checks run using the unified repository alone.
4. Default and non-default locale routes, article rendering and fixed article contract, SEO outputs, search, optional ad/comment behavior, and initializer-generated generic placeholders retain their existing behavior.
5. Documentation, lockfile, workflows, and scripts consistently identify the new single repository and do not describe a Core upgrade or package boundary.
6. Existing source repositories and game sites show no changes attributable to this task.

## Verification approach

Use a clean install from the unified repository, then run the relevant full starter check set: typecheck, lint, unit tests, config/content/i18n/link checks, production build, and initializer E2E. Inspect generated routes for default and secondary locales and compare the generated starter output against the initializer's preservation contract. Report environment or pre-existing failures separately from failures introduced by the merge. A local successful build does not constitute a production release.

## Delivery sequence

1. Reconcile overlapping files and finalize the migration map in an implementation plan.
2. Implement in a task branch or isolated checkout of the new repository.
3. Verify the unified starter against the acceptance criteria and inspect the complete diff.
4. Present a reviewable result. Do not deploy or merge without separate explicit authorization.

## Self-review

- Scope is limited to producing the unified reusable starter; existing site and production changes are excluded.
- The main risks are overlapping scripts, the article contract mismatch, internal package-path imports, and initializer E2E assumptions. Each is called out for explicit migration and verification.
- No claim is made that the source merge, tests, repository creation, or GitHub publication has occurred.

## Baseline correction

After this design was approved, the current GitHub default-branch snapshots were compared directly: `src/config/article-template.ts` is identical in both repositories. The earlier statement that the files differed came from comparing a stale local checkout. This correction changes no scope or architecture decision.
