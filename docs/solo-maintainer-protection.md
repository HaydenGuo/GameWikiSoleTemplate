# Single-maintainer protection

GameWikiSoleTemplate is maintained by one person. Its protection model uses automated verification and branch rules, without requiring a self-approval from the person who opened a change.

## Automated checks

The CI workflow runs lint, type checking, tests, configuration and content validation, build checks, internal-link checks, i18n checks, and initializer E2E. The source and article-contract tests protect the unified local runtime.

## Suggested branch settings

For `main`, configure:

1. Require a pull request before merging; do not require approvals.
2. Require CI checks to pass before merging.
3. Require branches to be up to date.
4. Disable force pushes and branch deletion.
5. Prevent administrators from bypassing the rule when available.

Do not require Code Owner review for a single-person repository; it adds a self-approval step without independent review.

Automated checks make changes auditable and protect against accidental drift. A repository administrator can still intentionally change branch rules or merge a bypass.
