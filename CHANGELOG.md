# Changelog

## [2.0.6](https://github.com/HaydenGuo/GameWikiSoleTemplate/compare/v2.0.5...v2.0.6) - 2026-10-24

- Publish the existing English and Japanese demo articles so they appear in the site navigation, category listings, search, and article routes.

将现有英文和日文演示文章从草稿改为发布状态，使其出现在网站导航、分类列表、搜索和文章页面中。

## [2.0.5](https://github.com/HaydenGuo/GameWikiSoleTemplate/compare/v2.0.4...v2.0.5) - 2026-10-24

- Refresh the homepage visual baseline with a calm blue accent system, paper-like surfaces, a segmented progress rail, and a responsive premium depth treatment inspired by the supplied reference video.

使用更克制的蓝色强调系统、纸张感内容面板、分段进度轨和响应式层次阴影更新首页视觉基线，适配用户提供的参考视频风格。

## [2.0.4](https://github.com/HaydenGuo/GameWikiSoleTemplate/compare/v2.0.3...v2.0.4) - 2026-10-20

- Prompt for the target game's Steam App ID and exact store title during initialization; remove the demo Steam ID from generated forks when omitted.
- Keep game-deals requests on a canonical same-origin URL, reuse Vercel CDN caching, and add optional Upstash Redis shared caching with an atomic refresh lock.
- Stop homepage and Deals clients from bypassing caches; add generated-fork and concurrency regression coverage.

初始化时询问目标游戏的 Steam App ID 和商店精确标题；未填写时不保留模板演示游戏 ID。规范同源 API 地址，复用 Vercel CDN 缓存，并支持 Upstash Redis 共享缓存和原子刷新锁；移除页面的缓存绕过请求并增加回归检查。

## [2.0.3](https://github.com/HaydenGuo/GameWikiSoleTemplate/compare/v2.0.2...v2.0.3) - 2026-10-20

- Lock game-deals callers to the same-origin `/api/game-deals` route and verify the root Vercel Function survives template initialization.
- Add a focused handler test for request validation without upstream network access.

确保 game-deals 调用固定使用同源 `/api/game-deals`，并验证模板初始化后根目录 Vercel Function 仍存在；增加不访问上游网络的请求校验测试。

## [2.0.2](https://github.com/HaydenGuo/GameWikiSoleTemplate/compare/v2.0.1...v2.0.2) - 2026-10-18

- Add reusable article page, question, answer-obligation, and visual-target markers for Stage 4 runtime audits.
- Verify that audit markers enclose visible content in the real initializer E2E.

为文章页和正文区域增加可复用的验收标记，并在真实 initializer E2E 中检查标记包含可见内容。

## [2.0.1](https://github.com/HaydenGuo/GameWikiSoleTemplate/compare/v2.0.0...v2.0.1) - 2026-10-18

- Validate that each non-draft pull request increases the template version and records matching release notes.
- Create the matching GitHub Release automatically after a versioned change reaches main.

为每个非草稿 PR 校验模板版本递增及对应更新记录；版本化变更合入 main 后自动创建匹配的 GitHub Release。

## [2.0.0](https://github.com/HaydenGuo/GameWikiSoleTemplate/compare/v1.1.4...v2.0.0) - 2026-10-18

- Make Vercel the default hosting platform for the Astro template.
- Move game-deals, article-view, and popular APIs to Vercel Functions.
- Remove non-Vercel deployment configuration and optional third-party analytics integrations.
- Update initialization, local development, privacy, and deployment guidance for Vercel.

将 Astro 模板的默认托管平台切换为 Vercel；三个同源 API 迁移至 Vercel Functions；移除非 Vercel 部署配置和额外分析集成；同步更新初始化、本地开发、隐私及部署说明。

## [1.1.3](https://github.com/HaydenGuo/GameWikiSoleTemplate/compare/v1.1.2...v1.1.3) - 2026-10-18

- Limit Quick Start to at most four content categories shown in the primary navigation, excluding utility routes.
- Remove cover zoom and arrow movement on Quick Start cards.

将 Quick Start 限定为最多四个一级内容栏目，并排除工具页面；移除卡片封面的悬停放大和箭头位移动效。

## [1.1.2](https://github.com/HaydenGuo/GameWikiSoleTemplate/compare/v1.1.1...v1.1.2) - 2026-10-17

- Streamline the stale-material audit, dependency review, and local verification workflow.
- Synchronize the project announcement version and copy with the formal release.

简化旧资料审计、依赖检查和本地验证流程；同步项目公告的版本号与本次正式发版内容。

## [1.1.1] - 2026-10-17

- Replace stale project branding, repository references, and platform guidance with current information.
- Exclude unverified Anvil Quest demo articles from published builds until they are source-checked.
- Keep homepage section links valid when example articles are drafts.

更新项目品牌、仓库引用和平台指南；未经核实的 Anvil Quest 示例文章改为草稿，不进入正式构建；首页示例卡片调整为指向有效栏目。

## [1.1.0] - 2026-10-17

- Add an EN language switcher to the site header and preserve the current page when switching locales.
- Adjust the header action group position on wide screens.
- Align landing comparison types and Steam stats tests with their current data.

为页眉增加 EN 语言切换，并在切换语言时保留当前页面；调整宽屏页眉控件位置；同步修正落地页比较数据类型和 Steam 统计测试。

This changelog tracks releases of the standalone `GameWikiSoleTemplate` repository. Earlier AnvilWiki product versions in `docs/PRD.md` are retained as pre-standalone project history and are not tags/releases of this repository.

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
