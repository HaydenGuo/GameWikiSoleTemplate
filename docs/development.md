# 开发指导(给 GameWikiSoleTemplate 本身写代码)

> 面向模板贡献者和维护者。fork 用户改配置/写内容请看 [apply-template.md](apply-template.md) 和 [content-format.md](content-format.md)。
> 硬约束(Agent 自动加载)在仓库根 [AGENTS.md](../AGENTS.md),本文解释**为什么**以及**怎么扩展**。

## 0. 第一条规则:三层分离

```
Code 层    src/pages, src/components, src/lib, src/i18n    — fork 用户永远不改
Config 层  src/config, src/locales, src/styles, wrangler.toml, astro.config.ts — fork 用户改一次
Content 层 src/content, src/locales/<loc>.json 的 home 数据 — fork 用户全替换
```

**每次写代码前自问:这个改动会不会强迫 fork 用户在 merge 上游时冲突?**
新功能尽量落在 Code 层且默认关闭(env 门控/optional 字段),这样 fork 用户 merge 上游永远安全——这是 staying-up-to-date.md 里 SemVer 兼容承诺的工程基础。

## 1. 验证(按改动范围选择)

本地只跑与改动相关的检查；GitHub PR CI 会执行完整门禁。常用对应关系：

| 改动 | 本地检查 |
|---|---|
| Astro/路由/配置/运行时代码 | `pnpm typecheck`、`pnpm lint`、`pnpm build`；路由或链接变化再跑 `pnpm check-links` |
| MDX/首页文案/内容链接 | `pnpm check-content`、`pnpm build`，然后 `pnpm check-links` |
| locale JSON | `pnpm check-i18n`；影响配置时再跑 `pnpm check-config` |
| 测试逻辑 | 运行对应测试；CI 会跑完整 `pnpm test` |
| workflow YAML/脚本 | YAML 解析或对应脚本检查 |
| 文档/纯格式 | `git diff --check`；无需为了文档改动重跑站点构建 |

模板派生站点的模板文件删除另需 `template-baseline:check`；实际项目发布另需 `check-publish-scope`。这两项只在对应场景运行，不作为每次模板 PR 的通用门槛。

## 2. 常见扩展模式

### 2.1 加一个 frontmatter 字段

1. `src/content.config.ts` 加 Zod 字段(**必须 optional 或带 default**——旧文章永远要能构建,这是版本策略承诺)
2. 消费端:
   - 页面渲染 → `ArticlePage.astro`
   - 单独组件 → 新建 `src/components/article/XxxCard.astro`,在 ArticlePage 里 `return null` 门控
   - 结构化数据 → `src/lib/seo.ts` 加 builder(纯函数 + 测试)
3. UI 文案 → `src/locales/en.json` + `ja.json` 同步加 key(**禁止组件里硬编码文字**;Zod 默认值里的英文 fallback 除外)
4. 文档:`docs/content-format.md` 字段表加一行
5. 若 AI 要能产这类内容:`.agent/skills/anvil-new-article` 的 Step 2 硬规则同步更新

### 2.2 加一个 MDX 组件

- 放 `src/components/mdx/`,零 JS 优先(原生 `<details>`/`<dialog>`),颜色只走 `var(--brand)` token
- 语义色 warn/danger 用 amber/red Tailwind(先例:过期横幅、Callout)
- demo 文章里至少用一个(否则没人知道它存在)
- `docs/content-format.md` 组件清单 + AGENTS.md 组件词汇表同步

### 2.3 加一个页面类型(如 /tags、/recent)

- 英文无前缀:`src/pages/<name>.astro`;其他语言:`src/pages/[locale]/<name>.astro`
- **必须**双语两份(路由结构见 AGENTS.md Astro gotcha #6)
- hreflang:`languageAlternates((loc) => pathFor(loc), locales)`
- **不回退英文的列表页**(tags):hreflang 和语言切换器只列该内容真实存在的语言(先例:TagListPage 的 `availableLocales` 三层透传)
- URL 帮助函数一律放 `src/lib/url.ts`(纯函数可测,别在组件里拼)

### 2.4 加一个脚本(scripts/)

- 只用 node 内置依赖 + tsx,不引第三方(先例:全部 9 个脚本)
- 只读审计类(check-*)→ exit 1 可 gate CI;改写类(apply-template)→ 交互确认 + `--dry-run`
- package.json scripts 注册 + AGENTS.md 命令区同步 + 本文第 1 节验证清单按需更新

### 2.5 加一个 CI 步骤 / workflow

- 只读审计 → 可直接进 ci.yml;**会写仓库的** → 单独 workflow + `permissions` 最小化 + 产出走 PR 或 issue,**永不直推 main**(先例:setup.yml 开 PR、content-pipeline.yml 开 issue)

## 3. 关键架构决策(为什么是这样)

| 决策 | 为什么 | 推翻条件 |
|---|---|---|
| 纯 Astro 零 JS runtime | Lighthouse 4×100 开箱契约是模板的核心卖点 | 无(ADR-002) |
| 一切可选功能 env 门控默认关闭 | fork 用户开箱 = 零 JS 零 cookie,保 4×100 | 无 |
| 文章详情回退英文、列表页不回退 | 详情追求可达(URL 永不 404),列表追求准确(不展示不存在的内容) | 无 |
| slugifyTag 等纯函数放 lib/url | `~/i18n/content` 引 `astro:content`,vitest 无法导入——纯函数必须隔离 | 无 |
| tags 页语言切换器限 availableLocales | 切换器链到 404 = 流失 + SEO 负信号 | 无 |
| 脚本 = AI 的验证后端,不追求交互体验 | v1.8 起 fork 用户对话产页,AI 跑脚本质检 | 无 |
| content-pipeline 只开 issue 不改内容 | LLM/自动化改内容的供应链与质量风险不可控,人工门控必须保留 | 出现可靠的确定性数据源时(如官方 codes API) |

## 4. 发版流程(SemVer)

```
1. 功能 PR 先通过本地检查、GitHub CI 和现有 Vercel 项目预览，再按用户确认合入 main
2. 合并后在 main 上发布新版本；版本号三处必须一致:
   - package.json "version"
   - src/config/landing.ts PROJECT_VERSION + 中英公告文案(announcement.text)
   - CHANGELOG.md 最新版本标题和日期
3. 发布前核对三个版本源与标签名一致，并确认公告文案描述的是本次版本，不沿用旧版本介绍。
4. 若版本是 PRD 路线图中的里程碑，再更新 `docs/PRD.md` §14.2 的状态。
5. 提交版本更新和对应的 `vX.Y.Z` 标签，推送 `main` 与标签；确认 main CI 和生产部署完成。
6. 创建 GitHub Release，包含日期、compare 链接和 CHANGELOG 对应的中英文摘要。
```

Minor = 新功能(默认关闭/向后兼容);Patch = 修复;Major = breaking(需在 CHANGELOG 写迁移说明)。config 层兼容承诺见 [staying-up-to-date.md](staying-up-to-date.md)。

## 5. 测试策略

- **只测纯函数**:`lib/url`、`lib/seo`、`lib/content-utils`(parseEntryId/isPossiblyOutdated 已从 i18n/content 下沉,tests/ 现状以 `pnpm test` 输出为准;依赖 astro:content 的加载器不进 vitest,新纯逻辑请下沉到 lib)
- 不测 .astro 组件(构建 + check-* 已覆盖)
- 新增纯函数 → 同步加测试;修 bug → 先加复现测试再修

## 6. 已知踩坑速查(完整版见 AGENTS.md「Astro 5 Content Layer Gotchas」)

| 坑 | 规则 |
|---|---|
| getStaticPaths 看不到文件顶层 const | 数据全部 inline 进函数体 |
| `Astro.params.slug` 读 rest 参数 | 不是 `Astro.props.slug` |
| `getEntry` 不要带 `.mdx` 后缀,`getCollection` 的 id 带 | 用 `parseEntryId` |
| workflow YAML `run: |` 块内 shell 续行缩进 | 续行必须 ≥ 块缩进,多行字符串宁可写一行 |
| tailwind 无 `nav-foreground` token | 用 `.card` 或 `primary-foreground` |
