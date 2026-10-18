# 配置参考手册

> 本仓库在一个源码树中维护通用运行时、站点配置和示例内容。`apply-template` 更新站点配置、正文、素材和语言；通用组件改动应同步更新测试与 starter baseline。

> 把 GameWikiSoleTemplate 从 demo 站（虚构游戏 "Anvil Quest"）换成你的目标游戏站点。
>
> 本文档按**文件**组织——你要改什么，就查对应文件的章节。不规定操作顺序，你想先改哪个都行。
>
> 核心原则：游戏身份和事实放在配置层、内容层与资源中；运行时代码保持通用，必要的通用行为可以在本仓库内修改。

---

## 文件索引

| 要改什么 | 去哪个文件 |
|---|---|
| 站点名称、域名、社交链接、游戏信息 | [src/config/site.ts](#1-site配置) |
| 导航分类（bosses / guides / codes...） | [src/config/navigation.ts](#2-navigation配置) |
| 主题色 | [src/styles/globals.css](#3-主题色) |
| 支持的语言 | [src/i18n/routing.ts](#4-语言列表) + [src/i18n/ui.ts](#4-语言列表) |
| 所有 UI 文案（首页、导航、页脚） | [src/locales/en.json](#5-ui文案) |
| AI 品牌图标源文件 | `src/assets/branding/brand-mark.png` |
| favicon / Hero 图 / PWA 生成产物 | [public/](#6-静态资源) |
| 文章内容 | [src/content/wiki/](#7-mdx-文章) |
| 广告 key | Vercel 项目环境变量 `PUBLIC_ADSENSE_*`（参考 [Google AdSense](https://adsense.google.com/)） |

> 想自动化基础配置？运行 `pnpm apply-template`，它会交互式引导你完成 site.ts / navigation.ts / globals.css / routing.ts / locales 的修改。脚本化/CI 场景用 `pnpm apply-template --answers answers.json` 非交互驱动（与交互同一问答路径，答案缺失或多余都会响亮报告）。

---

## 初始化清理规范（fork 后哪些"没用的内容"会被删掉）

模板作为 demo 站分发，自带一批**demo 专属内容**——fork 做你自己的游戏站时它们全是累赘。两条初始化通道共享同一份删除清单：

| 通道 | 怎么触发 | 特点 |
|---|---|---|
| `pnpm apply-template`（本地 CLI） | 终端交互式，自己点确认 | 会改游戏名/主题/语言/栏目；删除前逐项确认 |
| Actions → **Initialize GameWikiSoleTemplate** workflow | fork 仓库里点 Run workflow | 只做安全项（生成 `.env.example` + 删 landing + 清 demo），**开 PR 前先跑 `pnpm build` 验证**再交给你审 |

**删除清单（两个通道一致，改动必须同步 `scripts/apply-template.ts` 与 `.github/workflows/setup.yml`）：**

| 类别 | 具体内容 | 说明 |
|---|---|---|
| demo 文章 | `src/content/wiki/*/*/*.mdx` 全部（目录结构保留） | CLI 清空后**每个所选栏目自动补 1 篇英文脚手架**，保证 build 不空转；同时自动填充所选栏目的 `nav.<key>` 标签与 `overview.<key>` 条目（英文默认值，供你翻译/改写——不填的话 fork 第一次 `pnpm check-config` 就是红的） |
| 空栏目目录 | 清空后仍为空、且不在所选栏目里的内容目录 | 未选栏目的空目录是「不可达分类」（template-audit 会拦），一并剪掉 |
| demo 配图 | **全部按文件名删**（整目录 rm -rf 已废除）：所有示例图现在位于 `src/assets/articles/`；清单见 `scripts/lib/apply-rewrites.ts` 的 `DEMO_ARTICLE_IMAGES`（`tests/apply-template.test.ts` 钉住与 setup.yml 的同步） | 按名删除而非通配——`src/assets/articles/` 正是内容规范让你放**自己**文章图的地方，你的图绝不会被误删 |
| 项目官网 | `src/components/landing/`、`src/config/landing.ts`、`src/pages/landing*`（含站内文档中心 /landing/docs）、`src/pages/zh/landing*`（中文官网）、`public/images/showcase/`、`public/images/wechat-qr.jpg` | fork 站不需要 GameWikiSoleTemplate 项目自述页；`docs/handbook/` **markdown 源保留**当参考文档，只删路由 |
| 官网回链 | `src/config/project.ts` 的 `landingLinkEnabled` 翻为 `false` | 页面 header 的"返回官网"按钮随删随关 |
| demo 环境变量 | `.env.example` 重置：`SITE_URL` 换成你的域名，Giscus/Sponsor 等可选集成都清空 | 不重置的话，你站的评论区会指回官方仓库的 Discussions |
| demo 作者 | `src/config/authors.ts` 里 `// DEMO` 标记的作者条目 | 否则 Person JSON-LD 会引用虚构作者 |

**保留不删（有意设计）**：AI 品牌图标源文件、favicon/hero 图等资产。初始化命令不会把 GameWikiSoleTemplate 图标误当作新游戏图标；完成配置后，先按品牌图标工作流生成新源图，再运行 `pnpm gen-assets --force`。首页 Hero 图仍需按站点自行替换；`docs/handbook/` 手册源码保留。

**⚠️ 语言 JSON 分三类处理（重跑安全，按内容判定不只按文件名）**：未选择的语言里——① **demo 自带且仍是 demo 内容的**（`ja.json` 等，`site.name` 仍是 demo 站名）会被**直接删除**：它们装载着完整的 demo 游戏翻译，留着是身份泄漏，且 `pnpm check-config` 会对「locale 文件存在但不在 routing.ts」报错，fork 第一天 CI 就是红的；② **demo 文件名但内容已换成你游戏的**（比如上一轮运行选了 ja、这一轮没选）——内容判定发现 `site.name` 已不是 demo 站名，**只警告、绝不删除**；③ **你自己创建的** locale 文件（`pnpm new-locale` 加的等）同样**只警告、绝不删除**——重跑不能毁掉你的翻译工作。②③ 看到「Kept N locale file(s)」警告后自行决定删除或把该语言加进所选列表，处理前 `pnpm check-config` 会一直是红的。

**逃生口**：`pnpm apply-template --dry-run`（只打印不写入）、`--no-clear-content`（保留 demo 文章）、`--keep-landing`（保留项目官网）、`--answers answers.json`（非交互模式，复制第二个站/CI 时用）。

**事后体检**：`pnpm template-audit`——四层扫描（代码层无 demo 字符串 / 配置层是否还挂 demo 域名 / 内容层残留 / 换皮遗留文件），fork 站上线前跑一次确认没有"Anvil Quest"残留。

---

## 1. site 配置

**文件**：`src/config/site.ts`

这是站点信息的唯一来源。所有页面都从这里读站点名、域名、社交链接。

```ts
export const site = {
  name: 'Anvil Quest Wiki',          // → 改成 "{你的游戏名} Wiki"
  shortName: 'AQW',                  // → 缩写
  description: '...',                // → 含游戏名 + 核心关键词
  domain: 'your-game-wiki.example', // → 你的域名（不带 https://）
  enableDropdownNavigation: false,   // → true: 一级分类显示文章下拉；false: 仅显示一级链接
  tagline: '...',                    // → 副标题
  legalNotice: '...',                // → 法律声明
  contactEmail: '',                  // → 可选:公开联系邮箱(联系页渲染 mailto;没开任何社交渠道时必填)
  social: {
    official: 'https://...',         // → 游戏官网
    discord: 'https://...',          // → 没有就留 undefined
    youtube: 'https://...',
    twitter: 'https://...',
    reddit: 'https://...',
  },
  game: {
    name: 'Anvil Quest',             // → 游戏名
    platform: 'Steam',              // → Roblox / Steam / PS5 等
    developer: '...',               // → 开发商
    genre: 'Action RPG',            // → 游戏类型
    releaseDate: '2026-01-01',      // → 发售日（可选）
  },
};
```

导航栏左侧和浏览器标签页使用同一张品牌源图的不同尺寸：源文件是 `src/assets/branding/brand-mark.png`，Header 使用 `public/brand-mark-512.png`，浏览器使用 `public/favicon-48x48.png` 与 `public/favicon.ico`。不要配置独立的 Header 图标，以免品牌图形分叉。

**注意事项**：
- `enableDropdownNavigation` 有两种模式：`false` 保持紧凑的一级导航；`true` 只对 `src/config/navigation.ts` 中已经由内容规划阶段定义了 `subnavigations` 的分类显示下拉菜单。它不会按 MDX 文件自动猜测菜单内容。切换后重新运行 `pnpm build`。
- `subnavigations` 用于有明确二级分组的分类。下拉菜单只显示二级导航字段；点击字段后进入对应分类列表页的分组锚点，`paths` 中的文章在该分组页面展示，不会直接塞进顶部菜单。
- 普通 `direct_pages` 一级导航不配置二级菜单，因此只渲染为一级链接，不显示下拉三角。页面顺序和归属应来自上一阶段的导航规划。
- `domain` 不带 `https://` 协议前缀（协议由 `SITE_URL` 环境变量统一管理）
- 社交链接没有的留 `undefined`，不要删字段

---

## 2. navigation 配置

**文件**：`src/config/navigation.ts`

定义导航栏的分类。每个分类 = 一个内容类型。初始化时只能从模板提供的固定分类中选择；未选中的分类不会出现在站点中。分类键和 URL 保持稳定，但一级导航顺序会根据 `site.game.navigationProfile` 按游戏类型选择。

### 固定分类词汇表

| Key | Display name | 收录范围 | 适合启用的条件 |
|---|---|---|---|
| `guides` | Guides | 新手入门、流程、系统说明、任务做法和玩法教学 | 游戏存在需要步骤解释的玩法或进度路线 |
| `builds` | Builds | 角色、技能、队伍、武器或配装方案 | 游戏存在可组合的角色/技能/装备配置 |
| `items` | Items | 武器、防具、材料、消耗品、任务物品和收藏品 | 游戏有可查询的物品或装备资料 |
| `maps` | Maps | 地图、区域、路线、地点坐标和兴趣点 | 游戏有可探索地图、区域或位置收集内容 |
| `bosses` | Bosses | Boss 数据、机制、弱点、掉落和应对策略 | 游戏有独立 Boss 或精英敌人内容 |
| `tier-list` | Tier List | 按版本比较角色、武器、装备或流派强度 | 游戏存在稳定且有依据的强度比较 |
| `news` | News | 官方公告、补丁、活动和版本发布信息 | 游戏有持续更新或活动运营 |
| `codes` | Codes | 兑换码、奖励、有效期和兑换步骤 | 游戏确实提供可兑换代码 |

默认顺序（RPG）为：`Guides → Builds → Items → Maps → Bosses → Tier List → News → Codes`。

### 游戏类型导航变体

| `navigationProfile` | 推荐一级顺序 | 适用游戏 |
|---|---|---|
| `rpg` | Guides → Builds → Items → Maps → Bosses → Tier List → News → Codes | 单机 RPG、动作 RPG、魂类 |
| `mmorpg` | Guides → Builds → Bosses → Items → Maps → Tier List → News → Codes | MMORPG、长线角色扮演 |
| `moba` | Guides → Builds → Tier List → Maps → Items → News → Codes | MOBA、英雄竞技 |
| `fps` | Guides → Builds → Maps → Items → Tier List → News → Codes | 战术 FPS、英雄射击 |
| `battle-royale` | Guides → Maps → Items → Builds → Tier List → News → Codes | 大逃杀、多人射击 |
| `sandbox` | Guides → Items → Maps → Builds → News → Codes → Tier List | 沙盒、生存、创作、Mod 生态 |
| `strategy` | Guides → Builds → Items → Maps → Tier List → News → Codes | 4X、RTS、策略游戏 |
| `simulation` | Guides → Items → Builds → Maps → News → Codes → Tier List | 模拟经营、城市建造 |
| `card` | Guides → Builds → Items → Tier List → Maps → News → Codes | 卡牌、Deckbuilder、自动战斗 |

这是“顺序预设”，不是强制填满菜单。AI 和站点开发者仍必须依据真实内容启用栏目：没有对应内容就停用，不要为了填满导航创建空分类。单款游戏站不需要 `game library` 一级入口，因为整个站就是该游戏的资料库；“新闻”和“评测”也只有在确实承担媒体功能时才启用。

`apply-template` 会根据 `game.genre` 自动推断 profile，并把结果写入 `site.game.navigationProfile`。自动推断后应人工复核；如果手动修改 `site.ts` 中的 profile，还要按下表同步调整 `navigation.ts` 中的 `order`（或重新运行脚手架生成导航），否则只是记录了意图，页面入口顺序不会自动改变。一级导航的最终入口仍由实际选中的 `categories` 和三处一致性规则决定。

```ts
export const NAVIGATION_CONFIG = [
  { key: 'bosses', path: '/bosses', icon: 'lucide:swords', isContentType: true, order: 1 },
  { key: 'guides', path: '/guides', icon: 'lucide:book-open', isContentType: true, order: 2 },
  { key: 'codes',  path: '/codes',  icon: 'lucide:gift',     isContentType: true, order: 3 },
  // → 改成你的游戏需要的内容分类。order 应按照 navigationProfile 选择
  //   的类型顺序填写；isContentType 与 order 都是必填。
];
```

**必须同步的三处**（改了 navigation.ts 就必须同步另外两处）：

| 位置 | 例子 |
|---|---|
| `navigation.ts` 的 `key` | `bosses` |
| `en.json` 的 `nav.bosses` | `"bosses": "Bosses"`（显示文本） |
| `src/content/wiki/<locale>/bosses/` | 目录名必须 = key |

`icon` 从 [lucide 图标库](https://lucide.dev/)选，加 `lucide:` 前缀。

---

## 3. 主题色

**文件**：`src/styles/globals.css`（顶部 8 行：4 个变量 × 亮/暗）

```css
:root {
  --brand: 22 90% 52%;        /* 亮色主色（HSL，空格分隔） */
  --brand-light: 22 90% 62%;  /* 亮色浅色变体 */
  --brand-h: 22;              /* 色相（--brand-text 派生用） */
  --brand-s: 90%;             /* 饱和度（--brand-text 派生用） */
}
.dark {
  --brand: 22 85% 48%;        /* 暗色主色 */
  --brand-light: 22 85% 58%;  /* 暗色浅色变体 */
  --brand-h: 22;
  --brand-s: 85%;
}
```

**怎么换色**：把你的 hex 色值转成 HSL（用 [w3schools HSL 转换器](https://www.w3schools.com/colors/colors_hsl.asp) 或任何工具），替换这 8 行的值（`--brand-text` 由 `--brand-h/--brand-s` 自动派生，不用手改——漏改 h/s 会让文字色残留旧色相）。其他 CSS 变量（`--background` / `--foreground` / `--border` 等）通过 `var(--brand)` 自动跟随，不用改。

**验证**：
```bash
grep "brand" src/styles/globals.css          # 确认 8 行已更新
grep -rn "#[0-9a-fA-F]\{6\}" src/components/  # 确认组件里无硬编码 hex
```

---

## 4. 语言列表

**文件**：`src/i18n/routing.ts` + `src/i18n/ui.ts`

GameWikiSoleTemplate 支持 as-needed 前缀策略：英文（默认）无 URL 前缀，其他语言带前缀（`/ja/...`、`/ru/...`）。

### routing.ts

```ts
export const locales = ['en', 'ja'] as const;
// → 改成你需要的语言，如 ['en', 'ja', 'ru', 'es']
```

### ui.ts

每加一个语言，需要在 ui.ts 注册 import：

```ts
import en from '~/locales/en.json';
import ja from '~/locales/ja.json';
// → 加新语言：import ru from '~/locales/ru.json';

export const messages = { en, ja /* , ru */ };
```

同时创建对应的空 JSON 文件（缺 key 会自动 fallback 英文）：

```bash
echo '{}' > src/locales/ru.json
```

**必须同步的三处**：
1. `routing.ts` 的 `locales` 数组
2. `src/locales/` 下实际存在的 JSON 文件
3. `ui.ts` 的 import + `messages` 对象

少同步任何一处，构建会报错。

---

## 5. UI 文案

**文件**：`src/locales/en.json`（英文真相源）+ `src/locales/<locale>.json`（其他语言）

所有用户可见的文字都在这里。**组件里不硬编码任何文字。**

### 主要命名空间

| 命名空间 | 内容 | 示例 |
|---|---|---|
| `site` | 站点名、描述、法律声明 | `site.name`、`site.description` |
| `nav` | 导航栏分类文本 | `nav.bosses: "Bosses"` |
| `overview` | 列表页标题和描述 | `overview.bosses.overviewTitle` |
| `home` | 首页所有文案 | `home.hero`、`home.start`、`home.explore` 等 |
| `footer` | 页脚 | `footer.copyrightText` |
| `shared` | 通用文案 | `shared.readMore`、`shared.noArticles` |

### 首页 home 命名空间结构

首页的数据结构详见 [PRD §6.5](./PRD.md#65-首页-home-命名空间)。关键字段：

- `home.meta.title` / `description`：SEO 元数据（title 50-60 字符，description 150-160 字符）
- `home.hero`：Hero 区域（`badge` / `title` / `description` / `ctaPrimary` / `ctaSecondary`；可选 `coverImage` / `coverAlt` / `coverCaption` / `coverHref`。提供封面图时优先显示封面；否则使用可选 `videoId` / `videoCaption`）
- `home.start.cards[]`：QuickStart 卡片（每张含 `icon` + `href`，可选 `image`；有图片时显示为图片型卡片）
- `home.explore.modules[]`：内容模块（每个含 `displayType` + `highlights[]`，可选 `image`；有图片时显示为图片型模块）
- `home.closingCta`：底部号召文案

**SEO 要求**：`home.explore.modules[].name` 必须包含游戏名。

### 多语言翻译

非英文 JSON 缺 key 时会通过 deepMerge 自动 fallback 英文。所以你可以先只翻译部分 key，不会崩溃。

不要翻译的内容：
- 法律页正文（硬编码英文）
- 文章正文（走 MDX 文件，放 `src/content/wiki/<locale>/`）

---

## 6. 静态资源

**目录**：`public/`

| 文件 | 说明 |
|---|---|
| `favicon-48x48.png` / `favicon.ico` | 浏览器标签图标与 Google 搜索 favicon |
| `favicon.svg` / `favicon-16x16.png` / `favicon-32x32.png` | 兼容性输出；都从同一品牌源图派生 |
| `apple-touch-icon.png` | iOS 主屏图标（180×180） |
| `android-chrome-192x192.png` / `android-chrome-512x512.png` | Android 主屏图标 |
| `manifest.json` | PWA manifest（脚手架会改 `name` / `short_name` / `theme_color`，并保留有效图标路径） |
| `images/hero.webp` | Hero 图（模板自带可能是占位，必须换成真实图） |
| `images/home/*.svg` | 首页 Quick Start / Explore 通用卡片插图，可按游戏视觉替换 |

**Hero 图**：模板自带的可能是占位文件。换成你的真实 Hero 图，格式推荐 WebP（体积最小）。如果你拿到的是 PNG/JPG，用任何工具转成 WebP 后覆盖。

**首页视频**：在 `home.hero.videoId` 填入 11 位 YouTube ID 后，首页会显示缩略图和播放按钮；用户点击后才加载隐私增强模式 iframe。留空则不渲染视频区域。缩略图不可用时会退化为 YouTube 外链。

**favicon / Hero 图生成**：每个新站先按 [品牌图标工作流](./brand-mark-workflow.md)，结合游戏题材、经核对的代表意象和站点主题色生成专属图形，保存为 `src/assets/branding/brand-mark.png`。必须是正方形、至少 512×512、无文字/首字母/水印，并在 16×16 与 32×32 预览中仍能辨认。再运行 `pnpm gen-assets --force`；模板会从唯一源图生成 Header 图、ICO、PNG、Apple 和 Android/PWA 图标及首页分享大图。不要沿用 GameWikiSoleTemplate 的示例图标，也不要用“主题色背景 + 游戏首字母”作为生产图标。

---

## 7. MDX 文章

**目录**：`src/content/wiki/<locale>/<category>/`

每篇文章是一个 `.mdx` 文件，使用 YAML frontmatter：

```mdx
---
title: "文章标题 - 游戏名"
description: "155 字符以内的描述，含关键词"
category: "bosses"
date: 2026-08-11
lastModified: 2026-08-11
tags: ["boss", "guide"]
---

## 正文从 H2 开始
不写 H1——ArticlePage 自动用 title 渲染 H1。
```

文章格式详细说明见 [内容格式](./content-format.md)。

**分类目录名**必须与 `navigation.ts` 的 `key` 一致：`src/content/wiki/en/bosses/emberfang.mdx` → key = `bosses` → URL `/bosses/emberfang`。

**从其他格式迁移**：如果你的文章用的是 `export const metadata`（JS 元数据写法），需要手动改成 YAML frontmatter，详见 [内容格式 - 迁移](./content-format.md#从其他格式迁移文章)。

---

## 上线检查清单

```
□ site.ts 所有字段已换成新游戏
□ navigation.ts 分类与 content/ 子目录一致
□ globals.css 主题色已改（4 行）
□ routing.ts 语言与 locales/*.json 同步
□ en.json 无 demo 游戏名残留
□ favicon 全套已替换
□ hero 图是真实图片（非占位）
□ 所有 MDX frontmatter 通过 Zod schema（pnpm build 不报错）
□ sitemap URL 全部返回 200（pnpm check-sitemap）
□ Vercel 项目环境变量 `SITE_URL` 已配置（含 https:// 协议，见 [deployment.md](./deployment.md)）
```

---

## 模板化进阶：audit + 沉淀

第一个站跑通之后，别急着直接复制仓库做第二个游戏——先花 15 分钟做两件事（完整讲法见学习手册第 9 章）：

**1. 跑模板健康检查**：

```bash
pnpm template-audit
```

它会从三层分离的角度打分（如「模板健康度：8/10」）：代码层有没有混进游戏专属字符串（❌ 必须修——那是框架层的违约）、配置层还绑着旧游戏多少、内容层有没有 draft 遗留、demo 图片资产和 `.env.example` demo 值清干净没有。❌ 清零、⚠️ 逐条决定去留之后，这个仓库才是一个干净的模板。

**2. 沉淀换皮清单**：把「复制新站时必改哪些文件、必换哪些目录」写成 `docs/rebrand-checklist.md`（第 9 章有一段现成提示词可以生成初稿）。半年后复制第五个站时，照单执行，不用回忆任何细节。

之后每复制一个新站就是标准四步：复制仓库 → `pnpm apply-template` → 换内容层 → `pnpm build` 验证。批量铺内页见 `pnpm bulk-new-posts`（学习手册第 10 章）。

---

## 下一步

- [部署指南](./deployment.md)：部署到 Vercel
- [内容格式](./content-format.md)：MDX 文章怎么写
- [SEO 说明](./seo.md)：SEO 工程化细节
- 回到 [README](../README.md)
