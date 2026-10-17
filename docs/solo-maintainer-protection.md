# Single-maintainer protection

`GameWikiTemplate` is a single-maintainer repository. Its protection model is
automated verification, not a required approval from the same person who
opened the change.

## What is protected automatically

The `Solo maintainer / template-boundary` check verifies that:

- the site consumes the pinned `@hb-game-wiki/template` package from
  `GameWikiCore`;
- the fixed template source directories have not been copied into the content
  repository;
- the fixed article contract still matches the installed core package;
- the consumer still passes type checking and the test suite.

The existing `CI` workflow remains the broader release gate. It covers lint,
type checking, tests, configuration consistency, build output, content rules,
internal links, i18n coverage, and the real template E2E check.

## One-time GitHub branch settings

In `Settings → Branches → Add branch protection rule` for `main`, configure:

1. Require a pull request before merging. Do not require approvals.
2. Require status checks to pass before merging, then select:
   - `CI / check`
   - `CI / e2e-template`
   - `Solo maintainer / template-boundary`
3. Require branches to be up to date before merging.
4. Disable force pushes and branch deletion.
5. Enable the option that prevents administrators from bypassing the rule, if
   it is available for the repository.

Do not enable `Require review from Code Owners` for this repository. A
single-person Code Owner rule would only create a formal self-approval step;
it would not add independent review value.

## Core repository

Apply the same principle to `GameWikiCore`, but use a stricter rule there:
changes should normally enter through a pull request, and its core CI checks
must pass before `main` can move. A change to the core package is intentionally
allowed, but it must be explicit and separately reviewable from a content-site
change.

## Important limitation

These checks protect against accidental architectural drift and make changes
auditable. A repository administrator can still intentionally change branch
rules or merge a bypass. GitHub settings cannot provide independent human
review when the repository has only one maintainer.
