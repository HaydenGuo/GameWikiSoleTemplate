# Release process

The root `package.json`, `src/config/landing.ts` (`PROJECT_VERSION`), and
`CHANGELOG.md` are synchronized version sources for the standalone template. A
formal release exists only after its PR is merged to `main` and the post-merge
workflow creates the matching GitHub Release.

## Before a pull request is ready

Draft PRs may be used while work is still in progress. Before marking a PR ready
for review:

1. Choose the next SemVer version in the root `package.json`:
   - `PATCH` for compatible fixes and small presentation or content changes.
   - `MINOR` for backward-compatible capabilities.
   - `MAJOR` for breaking contracts, configuration, or migration requirements.
2. Set `PROJECT_VERSION` in `src/config/landing.ts` to the same value as
   `package.json`.
3. Add `## [X.Y.Z] - YYYY-MM-DD` at the top of `CHANGELOG.md`, with concise
   English release notes and a Chinese summary.
4. Run the applicable quality checks and review the complete PR diff.
5. Confirm the `release-policy` check passes. It verifies the synchronized
   project version, SemVer increase, and a dated, non-empty changelog entry.

Every change entering `main` gets a version, including documentation, content,
configuration, and workflow changes. Several related commits in one PR still
produce one version. Closed or unmerged PRs do not create a formal release.

## After merge

When a versioned change reaches `main`, the `Release policy` workflow reads the
matching changelog entry and creates a GitHub Release tagged `vX.Y.Z` at the
merged commit. If the workflow fails, fix the release job and rerun it; do not
create a tag pointing at an unmerged commit.

The `Protect main - release policy` ruleset is active on the default branch. It
requires pull requests and the `Release policy / release-policy` status check,
with no bypass actors. Keep the workflow's required check name stable; changing
the check name requires updating the ruleset as well.
