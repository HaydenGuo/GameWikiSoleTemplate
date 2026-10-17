# Release process

The root `package.json` version and `CHANGELOG.md` are the version record for
the standalone template. A formal release exists only after its PR is merged to
`main` and the post-merge workflow creates the matching GitHub Release.

## Before a pull request is ready

Draft PRs may be used while work is still in progress. Before marking a PR ready
for review:

1. Choose the next SemVer version in the root `package.json`:
   - `PATCH` for compatible fixes and small presentation or content changes.
   - `MINOR` for backward-compatible capabilities.
   - `MAJOR` for breaking contracts, configuration, or migration requirements.
2. Add `## [X.Y.Z] - YYYY-MM-DD` at the top of `CHANGELOG.md`, with concise
   English release notes and a Chinese summary.
3. Run the applicable quality checks and review the complete PR diff.
4. Confirm the `release-policy` check passes. It verifies that the PR version is
   newer than the target branch and that the changelog has a non-empty entry for
   that exact version.

Every change entering `main` gets a version, including documentation, content,
configuration, and workflow changes. Several related commits in one PR still
produce one version. Closed or unmerged PRs do not create a formal release.

## After merge

When a versioned change reaches `main`, the `Release policy` workflow reads the
matching changelog entry and creates a GitHub Release tagged `vX.Y.Z` at the
merged commit. If the workflow fails, fix the release job and rerun it; do not
create a tag pointing at an unmerged commit.

The repository administrator should configure `Release policy / release-policy`
as a required status check for `main`. The workflow reports the gate, while
branch protection makes the gate mandatory.
