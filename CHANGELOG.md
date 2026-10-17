# Changelog

This changelog tracks releases of the standalone `GameWikiSoleTemplate` repository. Earlier AnvilWiki product versions in `docs/PRD.md` are retained as pre-standalone project history and are not tags/releases of this repository.

## [1.0.2] - 2026-10-17

- Define the release boundary at merge to `main`; unmerged pull requests do not consume a formal version.
- Require each mergeable pull request to include a SemVer bump and matching changelog entry.
- Automate the PR version gate and create a GitHub Release after the versioned change reaches `main`.

规定每个进入 main 的变更都升版并记录；未合并的 PR 不发布正式版本，合并后自动创建 GitHub Release。

## [1.0.1] - 2026-10-17

- Remove automatically generated tag archive pages and their navigation links to avoid thin pages when tags are used by only one article.
- Keep article tags as metadata for related-article recommendations.

移除自动生成的标签聚合页及其入口，避免单篇标签页；文章标签仍用于相关文章推荐。

## [1.0.0] - 2026-10-17

First formal release of the standalone merged template repository.

- Bring the reusable wiki runtime, starter configuration, example content, and validation workflow together in one repository.
- Keep homepage card covers unique within each visual group.
- Document change classification and review boundaries for architecture, behavior, config/content, docs/process, and format-only changes.

首个独立仓库正式版本。

- 将可复用 wiki 运行时代码、起步配置、示例内容和验证流程整合到同一仓库。
- 确保首页每个视觉区块内的卡片封面不重复。
- 明确架构、行为、配置/内容、文档/流程和纯格式修改的分类及评审边界。
