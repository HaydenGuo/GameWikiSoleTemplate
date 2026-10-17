# MDX 文章格式

> 怎么写一篇 AnvilWiki 的 MDX 文章。文章是 wiki 的核心——文件路径即 URL。

---

## 文件位置与 URL 映射

文章放在 `src/content/wiki/<locale>/<category>/<slug>.mdx`：

```
src/content/wiki/en/bosses/emberfang.mdx           → /bosses/emberfang
src/content/wiki/en/guides/beginner-guide.mdx  → /guides/beginner-guide
src/content/wiki/ja/bosses/emberfang.mdx           → /ja/bosses/emberfang（日文版）
```

> `category` 必须与 `src/config/navigation.ts` 的 `key` 一致。模板只允许固定栏目 `guides`、`builds`、`items`、`maps`、`bosses`、`tier-list`、`news`、`codes`。初始化时先写好第一批文章，再在 `pnpm apply-template` 中启用对应栏目；不要新增自定义分类或调序。

---

## Frontmatter（YAML 头部）

每篇文章用 YAML frontmatter 声明元数据。**构建时会用 Zod schema 校验**——字段缺失或类型错误会导致 build 失败。

```mdx
---
title: 'Emberfang Boss Guide - Complete Strategy'
description: 'Complete strategy guide for defeating Emberfang, including attack patterns and weaknesses.'
category: 'bosses'
date: 2026-08-11
lastModified: 2026-08-12
tags: ['boss', 'ice', 'early-game']
noindex: false
---
```

### 字段说明

| 字段           | 类型     | 必填 | 校验规则                             | 用途                                     |
| -------------- | -------- | ---- | ------------------------------------ | ---------------------------------------- |
| `title`        | string   | ✅   | ≤ 80 字符                            | SEO title + H1（正文不写 H1）            |
| `template`     | string   | 可选 | 默认 `default-article`，不可使用其他模板 | 固定页面外壳版本；正文作者不修改页面结构 |
| `description`  | string   | ✅   | 40-165 字符                          | meta description + 文章副标题            |
| `category`     | string   | ✅   | 必须在 `navigation.ts` 的 key 列表里 | 决定 URL 路径和列表页归属                |
| `date`         | date     | ✅   | ISO 格式（YYYY-MM-DD）               | 发布日期 + Article JSON-LD datePublished |
| `lastModified` | date     | 可选 | ISO 格式                             | 最后修改日期（JSON-LD dateModified + sitemap lastmod；boss/tier-list 超 90 天自动显示"可能过期"提示） |
| `tags`         | string[] | 可选 | 默认 `[]`                            | "相关文章"推荐 + 标签聚合页（`/tags/<tag>`，v1.5 起文章页 tag 可点击） |
| `keywords`     | string[] | 可选 | 最多 8 个，每项 1-80 字符              | 文章级搜索意图词；有值时输出 keywords meta tag |
| `draft`        | boolean  | 可选 | 默认 `false`                         | 草稿：`pnpm dev` 可预览，生产构建完全排除（页面/列表/RSS/sitemap） |
| `gameVersion`  | string   | 可选 | ≤ 20 字符                            | 适用的游戏版本号（如 `v2.5`），文章头渲染成徽章——快速迭代游戏的时效性/E-E-A-T 信号 |
| `noindex`      | boolean  | 可选 | 默认 `false`                         | 设为 `true` 禁止搜索引擎索引此页         |
| `summary`      | string   | ✅   | ≤ 400 字符（40–60 词直答）           | 固定 Quick Answer 组件的可填写内容       |
| `author`       | string   | 可选 | 缺省用 `site.defaultAuthor`           | 作者署名（E-E-A-T）                       |
| `boss`         | object   | 可选 | hp/weakness/resistant/location/recommendedLevel | 结构化 Boss 数据卡（正文前渲染）   |
| `videos`       | string[] | 可选 | 仅用于正文内联 `<Video>` 的 YouTube 视频 ID（11 位，非完整 URL） | 仅为明确内嵌的视频生成 VideoObject JSON-LD；不会自动渲染“相关视频”区块 |
| `codes`        | object[] | 可选 | code/reward/status/expiryDate/source（v1.8） | codes 页结构化数据：正文前自动渲染 Active（CodeBlock 一键复制）/ Expired（表格）分区 + FAQPage JSON-LD |
| `faq`          | object[] | 可选 | 每项 `{question, answer}`（非空字符串） | 文末可见 FAQ 区块 + FAQPage JSON-LD（可见内容与结构化数据一致，符合 Google 富结果政策） |
| `decisionFilter` | object | 可选 | `title/prompt/emptyLabel/items[]` | 文章前置的场景筛选器；每项提供 `label/value/answer/detail` |
| `taskPlanner` | object | 可选 | `title/prompt/options[]` | 文章前置的可勾选任务规划器；每项提供 `label/value/answer/steps[]/note?` |
| `articleTool` | object | 可选 | `type: field-note` 或 `type: readiness` | 文章前置的 field note 或 readiness dashboard |
| `sources`      | object[] | 可选 | 每项 `{title, url, publisher, publishedAt, note}`；URL 只允许官网、YouTube、Steam 或配置的游戏 subreddit | 文末公开 Sources 列表；未批准域名会导致 build/check-content 失败 |

### Sources 来源白名单

文章正文和 frontmatter `sources` 只能公开引用以下来源：

- 当前游戏配置中的官网：`site.social.official` 及其子路径
- YouTube：`youtube.com`、`youtu.be`
- Steam：`store.steampowered.com`、`steamcommunity.com`
- 当前游戏配置中的 Reddit subreddit：`site.social.reddit` 及其帖子路径

对标网站、第三方 Wiki、媒体、攻略站、数据库和聚合站只能用于内部结构/选题研究，不能在正文中命名、链接、转述，也不能写入 `sources`。校验规则在 schema 和 `pnpm check-content` 中同时执行；Reddit 未配置对应 subreddit 时不允许作为公开来源。

### 可在 MDX 中使用的模板组件

MDX 里可以直接 import 模板组件（无需任何配置）：

**给 AI 的组件选择提示：**`ImageText` 和 `GuideFlow` 是按需选用的排版组件，不是每篇文章的必选项。生成文章时先判断它们是否能让内容更容易理解；普通段落、表格或简单步骤列表已经够清楚时，就保持普通正文，不要为了展示组件而硬加。

| 组件 | 适合使用 | 保持普通正文的情况 |
|---|---|---|
| `ImageText` | 一张有信息价值的本地图片需要与较完整的说明并排讲解；可用 `imagePosition="left"` 或 `"right"` 选择图片位置 | 图片只是封面/独立插图，或配套文字很短；改用 `ArticleImage` 或普通正文 |
| `GuideFlow` | 玩家需要按顺序完成多个步骤，或根据条件选择下一步 | 只有一两步的简单线性操作；用有序列表即可 |

流程图保持紧凑，通常 3–4 个节点；不要把整篇攻略塞进一个流程图。

```mdx
import CodeBlock from '~/components/article/CodeBlock.astro';
import StatBar from '~/components/article/StatBar.astro';
import Callout from '~/components/mdx/Callout.astro';
import Accordion from '~/components/mdx/Accordion.astro';
import ItemInlineIcon from '~/components/mdx/ItemInlineIcon.astro';
import ArticleImage from '~/components/mdx/ArticleImage.astro';
import ImageText from '~/components/mdx/ImageText.astro';
import GuideFlow from '~/components/mdx/GuideFlow.astro';
import frostpikeImage from '~/assets/articles/weapon-frostpike.png';
import DecisionFilter from '~/components/mdx/DecisionFilter.astro';
import TaskPlanner from '~/components/mdx/TaskPlanner.astro';

<CodeBlock code="FORGE-2026" label="+500 Gold · expires Aug 31" />

<StatBar label="Molten Gem" value={35} />
<StatBar label="Rare Helm" value={5} note="1 in 20 runs" />

<Callout type="warn" title="Patch v2.5">Mechanics changed in this patch — the old strat no longer works.</Callout>
<Callout type="tip">Ice weapons shorten this fight by a third.</Callout>

<Accordion title="Phase 2 details (spoiler)">战术细节……</Accordion>
<ItemInlineIcon label="Rare Helm" src="/images/items/rare-helm.webp" />
<ArticleImage src={frostpikeImage} alt="Frostpike Staff weapon card" />

<ImageText src={frostpikeImage} alt="Frostpike Staff weapon card" imagePosition="left">
  ## Frostpike Staff

  A compact image-and-copy section. On mobile the image stacks above the text;
  on desktop, set `imagePosition="right"` to reverse the two columns.
</ImageText>

<GuideFlow
  title="Choose an upgrade"
  steps={[
    { kind: 'step', title: 'Check your level', detail: 'Confirm the next bench is unlocked.' },
    {
      kind: 'decision',
      title: 'Ready for the next tier?',
      choices: [
        { label: 'Yes', result: 'Craft the next weapon.' },
        { label: 'No', result: 'Keep farming materials.' },
      ],
    },
  ]}
/>
```

复杂组件也可以直接在 MDX 中调用（示例数据可替换为当前文章内容）：

```mdx
<DecisionFilter
  title="Choose a route"
  items={[
    { label: 'Solo', value: 'solo', answer: 'Use the safe route.', detail: 'Bring one mobility option.' },
    { label: 'Group', value: 'group', answer: 'Use the fast route.', detail: 'Assign one player to scouting.' }
  ]}
  labels={{ eyebrow: 'Interactive guide', all: 'All', prompt: 'Filter by situation', empty: 'No matching advice.' }}
/>

<TaskPlanner
  title="Preparation checklist"
  options={[
    { label: 'First attempt', value: 'first', answer: 'Start with the safe setup.', steps: ['Read the notes', 'Pack a spare item'] },
    { label: 'Repeat run', value: 'repeat', answer: 'Use the faster setup.', steps: ['Confirm the route', 'Review the reward table'] }
  ]}
  labels={{ eyebrow: 'Interactive checklist', prompt: 'Choose your situation', copy: 'Copy checklist', copied: 'Copied', copyFailed: 'Copy failed', reset: 'Reset', progress: '{completed}/{total} complete', notePrefix: 'Note: ' }}
/>

<ArticleFieldNote eyebrow="Before you start" title="Key check" body="Confirm the important input before acting." chips={['source', 'version']} />
<ArticleReadinessDashboard eyebrow="Readiness" title="Page readiness" centerLabel="Ready" items={[
  { label: 'Route', status: 'ready', detail: 'The route is documented.' },
  { label: 'Gear', status: 'check', detail: 'Verify the current patch.' },
  { label: 'Source', status: 'missing', detail: 'Add a source before publishing.' }
]} labels={{ ready: 'Ready', check: 'Check', missing: 'Missing', legendAriaLabel: 'Status legend', itemsAriaLabel: 'Page checks', summary: '{ready}/{total} checks ready' }} />
```

- **CodeBlock** — 一键复制游戏兑换码（codes 页留存神器）
- **StatBar** — 掉落率/属性条形可视化
- **Callout** — 提示框，`type`: `info`（默认）/ `tip` / `warn` / `danger`，零 JS（v1.5）
- **Accordion** — 原生 `<details>` 折叠面板，用于分阶段打法/剧透/平台差异，零 JS（v1.5）
- **AffiliateLink** — 联盟/外链 CTA 卡片，自动带 `rel="sponsored nofollow"`（SEO 合规的第二变现渠道，v1.7）
- **Video** — 仅在确实需要播放器时使用的正文内联 YouTube 组件（懒加载 facade）。放哪渲染哪：`<Video id="..." title="..."/>`；**id 必须同时登记进 frontmatter `videos`**（VideoObject JSON-LD 来源）。普通视频资料只放进 `sources`，不会自动生成“相关视频”区块（v1.8）。
- **ArticleImage** — 使用 `src/assets/articles/` 中的图片渲染经过 Astro 优化的正文图片；图片来源和授权信息应登记到站点的媒体清单。
- **ImageText** — 响应式图文段落；`src` 和 `alt` 必填，`imagePosition` 可选 `left` 或 `right`（默认 `left`），`caption` 可选。手机端图片在上、文字在下，桌面端按设置左右排列。
- **GuideFlow** — 用 `title` 和 `steps` 渲染紧凑的攻略流程。每个步骤提供 `kind`（`step` 或 `decision`）和 `title`，可选 `detail` 与 `choices`；每个分支选项提供 `label` 与 `result`。建议将一个组件控制在 3–4 个节点，复杂流程拆成多个有标题的小流程。
- **ItemInlineIcon** — 在表格或短列表中显示一个本地小图标和条目名称；组件本身不绑定任何游戏数据。
- **DecisionFilter** — 按玩家场景筛选建议卡片；交互使用原生 JavaScript，界面文案由 `src/locales/<locale>.json` 的 `shared.widgets` 提供。
- **TaskPlanner** — 在多个方案之间切换、逐项勾选并复制清单；步骤和方案写入 frontmatter `taskPlanner`，界面文案由 locale 提供。
- **ArticleFieldNote** — 文章前置的重点提示卡，可使用图标、图片和最多 5 个 chips。
- **ArticleReadinessDashboard** — 用 `ready/check/missing` 三态展示文章或任务准备度；至少提供 3 个检查项，状态文案由 locale 提供。

文章级小组件示例（写入 frontmatter 后会自动出现在 FAQ 与正文之间）：

```yaml
keywords: ['boss route', 'early game build']
decisionFilter:
  title: 'Choose a route'
  prompt: 'What are you preparing for?'
  emptyLabel: 'No matching advice.'
  items:
    - { label: 'Solo', value: 'solo', answer: 'Use the safe route.', detail: 'Bring one mobility option.' }
    - { label: 'Group', value: 'group', answer: 'Use the fast route.', detail: 'Assign one player to scouting.' }
taskPlanner:
  title: 'Preparation checklist'
  prompt: 'Select your plan'
  options:
    - { label: 'First attempt', value: 'first', answer: 'Start with the safe setup.', steps: ['Read the mechanic notes', 'Pack a spare item'] }
    - { label: 'Repeat run', value: 'repeat', answer: 'Use the faster setup.', steps: ['Confirm the route', 'Review the reward table'] }
articleTool:
  type: 'readiness'
  eyebrow: 'Before you start'
  title: 'Page readiness'
  centerLabel: 'Ready'
  items:
    - { label: 'Route', status: 'ready', detail: 'The route is documented.' }
    - { label: 'Gear', status: 'check', detail: 'Verify the current patch.' }
    - { label: 'Rewards', status: 'missing', detail: 'Add a source before publishing.' }
```

小组件的内容数据仍属于当前文章；不要把游戏专属索引、物品清单或 finder 数据复制进模板。需要游戏专属查询器时，应在具体 fork 中另建数据层和 route guard。

### 媒体密度建议（排名因素）

纯文字页在游戏 wiki 赛道没有竞争力。按页面类型给参考密度（demo 文章均按此示范）：

| 页面类型 | 封面 | 正文内联图 | 视频 |
| --- | --- | --- | --- |
| boss 攻略 | ✅ 必配 | 机制说明处按需插入 2-4 张（机制图/路线图） | ≥1（关键躲避点） |
| 教程/路线 | ✅ 必配 | 每个大节可配 1 张，路线/流程图直接插在对应步骤之后 | 按需 |
| tier list/对比 | ✅ 必配 | 重点条目 1 张卡片图 | 按需 |
| codes | ✅ 必配（分享卡片辨识度） | 无需 | 无需 |

> **封面图质量 = 图片搜索入口**（2026-03 起 Google 选图首选 og:image）：封面不再是装饰，每篇文章的封面直接决定该页在 Google 图片搜索里的展示。挑图三原则：清晰可辨（缩略图下仍认得出游戏）、带游戏视觉标识（角色/logo/UI，不用纯文字图）、与文章主题对应（boss 文章不配风景图）。
>
> 每篇文章必须至少包含一张真实的本地游戏图片，并通过 `ArticleImage` 渲染。正文中的第一张图片会自动同时作为文章封面、列表卡片图片和社交预览图；因此不再维护单独的 `covers/` 目录，也不再填写 frontmatter `image` 字段。

### 固定页面外壳与灵活正文

文章页面的外壳固定为：

```text
Quick Answer（固定组件）
正文（可自由编写的 MDX）
Sources（固定组件）
```

- `summary` 是 Quick Answer 的内容，格式和位置由页面模板固定，正式文章必须填写。
- Quick Answer 与 Sources 之间的 MDX 是唯一的灵活正文区域，可以自由使用 H2、表格、步骤、提示框、视频和图片。
- 正文不得再次创建 `Quick Answer` 或 `Sources` 标题/组件，否则会产生重复信息并被 `pnpm check-content` 拒绝。
- Sources 的组件格式固定，作者只填写 frontmatter 中的来源数据。
- 文章模板定义位于 `src/config/article-template.ts`；页面组件不应由内容作者或 AI 直接修改。

### 作者体系（v1.7）

frontmatter `author` 除署名展示外，还可在 `src/config/authors.ts` 注册该作者的
主页 URL / 社交链接 —— 文章头署名变成链接，Article JSON-LD 的 author 从
Organization 升级为 **Person**（E-E-A-T 加分）。不注册则维持原样。

### Patch notes / 更新日志范式

游戏每次版本更新都是搜索流量高峰（玩家搜 "game name patch notes August"）。不需要新增 `patch-notes` 分类：把版本更新文章放进固定的 `news` 栏目，`date` 使用版本日期、`lastModified` 持续更新，首页用 `timeline` displayType 模块呈现版本时间线，RSS 会把每次更新推给订阅者。demo 的 codes 文章（`src/content/wiki/en/codes/all-codes.mdx`）演示了同类"高频更新"内容的完整写法。

### 校验失败示例

```mdx
---
title: 'Guide' # ❌ 太短（虽然 ≥1 字符就过，但 SEO 不好）
description: 'Short' # ❌ 少于 40 字符，build 失败
category: 'unknown' # ❌ 不在 navigation.ts，路由 404
date: '上周二' # ❌ 不是 ISO 格式，Zod 解析失败
---
```

---

## 正文规则

### 从 H2 开始，不写 H1

```mdx
---
title: 'Emberfang Boss Guide'
---

## Boss Overview ← ✅ 第一个标题是 H2

...
```

**不要写 H1**——`ArticlePage` 组件自动用 frontmatter 的 `title` 渲染 H1。如果你也写 H1，会导致双 H1，影响 SEO。

### 关键词密度（别堆游戏名）

标题和正文里游戏名的重复度保持在 **1-3%**。本模板的标题体系默认处处带游戏名（站名、H1、分类标题、首页模块名），正文再照抄这个习惯，游戏名密度会冲到 5-6%，属于关键词堆砌，谷歌会压排名。写法：标题里游戏名最多出现一次，正文自然提及即可——页面主题靠站内互链和分类结构传达，不靠重复名词。

### 每篇至少 3 条站内链接

从每篇文章正文链向 **≥3 篇**本站相关文章（`check-content` 会给不足 3 条的文章出 warning）。内链帮谷歌理解站点结构，也给新页面导权重；零内链的文章是「孤岛页」，收录和排名都吃亏。链接要落在自然的语境词上，不要文末堆一排。

### 支持的 Markdown 语法

- 标题（H2-H4，建议不跳级）
- 列表（有序/无序）
- 表格（GitHub Flavored Markdown）
- 代码块（```语法高亮）
- 引用（`>`）
- 链接（站内页面用带尾斜杠的绝对路径，如 `/bosses/emberfang/`——全站 trailingSlash 为 always；外链用完整 URL）
- 图片：正文图片放在 `src/assets/articles/`，通过 `ArticleImage` 导入，建议 16:9（800×450）。组件会使用 Astro Image 优化；图片必须提供有意义的 alt 文本。
  - ⚠️ `ArticleImage` 的第一张图同时承担封面、列表卡片和 OG 图片职责，不能只把图片放在 `public/` 或只填写一个封面字段。`public/` 只保留 favicon、manifest、robots 等需要固定 URL 的站点资源。
  - `pnpm check-content` 会拒绝 `public/images/articles/` 中的文件，以及 MDX 中的 `/images/articles/...` 旧路径，防止资源规则回退。
  - 💡 demo 示范：`en/guides/weapon-tier-list.mdx` 使用正文内联卡片图。将机制图或路线图放在对应说明段落之后，不要堆到文末。

### MDX 扩展（可选）

MDX 支持 JSX 组件，但 AnvilWiki 默认不引入 React 组件。如果你需要复杂交互，参考 [PRD §ADR-002](./PRD.md#adr-002为什么用纯-astro-原生组件而不是-react-islands) 的说明。

---

## 从其他格式迁移文章

如果你手上的文章用的是 JS 元数据写法（常见于 Next.js / MDX 项目）：

```mdx
export const metadata = {
  title: "文章标题",
  description: "描述",
  category: "bosses",
  date: "2026-08-01",
  tags: ["guide"]
};

## 正文从 H2 开始
...
```

AnvilWiki 用 YAML frontmatter，需要手动改成：

```mdx
---
title: "文章标题"
description: "描述"
category: "bosses"
date: 2026-08-01
tags: ["guide"]
---

## 正文从 H2 开始
...
```

**迁移步骤**：
1. 删除 `export const metadata = { ... };` 整块（连同末尾分号和空行）
2. 在文件最顶部加 `---` 包裹的 YAML frontmatter，字段一一对应
3. YAML 里字符串值用双引号包裹，数组用 `[...]` 语法，日期不加引号
4. 其余正文内容不变
5. 运行 `pnpm build` 验证 frontmatter 通过 Zod schema 校验

> 批量迁移时，可以用 AI 编辑器（Cursor / Claude Code）的正则替换功能，或写一个简单的 Node 脚本完成转换。模板不内置转换脚本——frontmatter 字段少、格式简单，手动或 AI 辅助转换即可。

---

## 多语言文章

每种语言一个目录：

```
src/content/wiki/
├── en/bosses/emberfang.mdx     → /bosses/emberfang
└── ja/bosses/emberfang.mdx     → /ja/bosses/emberfang
```

### Fallback 行为

| 场景                                         | 行为                                                         |
| -------------------------------------------- | ------------------------------------------------------------ |
| 访问 `/ja/bosses/emberfang` 且**有日文版**       | 显示日文                                                     |
| 访问 `/ja/bosses/emberfang` 但**无日文版**       | **自动回退英文**（不 404），页面显示 "English fallback" 标记 |
| 访问 `/ja/bosses/`（列表页）且**无日文文章** | 显示空状态（**不回退英文**）                                 |

> 这种不对称是设计决策：详情页保证 URL 可达（不 404），列表页保证准确性（不展示没有的内容）。

---

## 文件命名规范

slug（文件名）= URL 最后一段：

```
src/content/wiki/en/bosses/emberfang-boss-guide.mdx → /bosses/emberfang-boss-guide
```

**规则**：

- 全小写
- 单词用连字符分隔（`emberfang-boss-guide`，不是 `EmberfangBossGuide` 或 `emberfang_boss_guide`）
- 不含特殊字符（`?:/`)
- 建议：与目标关键词一致（SEO）

---

## 新建文章脚手架

```bash
pnpm new-post
# 交互式输入：locale / category / slug / title
# 自动生成带 frontmatter 的 MDX 模板
```

> 已实现（`scripts/new-post.ts`）。运行 `pnpm new-post` 交互式生成。

---

## 下一步

- [套用模板指南](./apply-template.md)
- [SEO 说明](./seo.md)
- 回到 [README](../README.md)
