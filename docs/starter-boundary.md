# GameWikiTemplate starter boundary

## 角色

`GameWikiCore` 是唯一的架构来源，负责页面路由、布局、组件、SEO、搜索、固定文章结构、运行时工具和通用样式。

`GameWikiTemplate` 是可复制的模板游戏内容站，负责提供一套示例配置和内容，供新游戏站替换。

具体游戏站应当从本仓库复制，而不是复制 `GameWikiCore` 的源码目录。

## 可以修改的内容

- `src/config/`：站点信息、导航、作者、广告、社交链接、文章模板适配配置
- `src/content/`：游戏文章和 frontmatter
- `src/assets/`：文章正文图片、游戏素材和本地资源
- `src/locales/`：界面翻译和游戏站文本
- `public/`：favicon、静态文件和可公开引用的素材
- `astro.config.ts` 中的站点域名、语言和部署元数据
- `.env.example` 对应的站点环境变量

文章必须继续满足固定契约：

```text
Quick Answer → body → Sources
```

正文 `body` 可以自由写作，但 Quick Answer 和 Sources 的位置、数量和渲染方式由核心包控制；正文至少需要一张本地游戏图片，第一张正文图片自动作为文章卡片封面。

## 不应修改的内容

- `src/components/`
- `src/pages/`
- `src/lib/`
- `src/i18n/`
- `src/styles/`
- `@hb-game-wiki/template` 的版本和 GitHub tag，除非执行一次明确的核心升级
- `pnpm-workspace.yaml` 中的核心包边界

这些目录在本地会以 junction 指向 `node_modules/@hb-game-wiki/template/src`。如果它们变成普通目录，边界检查会失败，不应直接在内容站里修补。

## 日常命令

```powershell
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```

上述命令会自动执行：

1. 把核心源码链接到本地消费站；
2. 检查 GitHub 精确版本引用与 lockfile 中的 tag、commit 和包版本一致；
3. 检查核心目录是否仍是 junction；
4. 检查 Quick Answer、body、Sources 文章契约是否存在。

## 核心包升级

升级只能通过明确修改根目录 `package.json` 中的版本和 `pnpm-lock.yaml` 完成。例如将 `v2.1.0` 改为经过验证的新 tag，然后运行：

```powershell
pnpm install
pnpm check-template-boundary
pnpm typecheck
pnpm build
```

升级核心包不会覆盖 `src/config`、`src/content`、`src/assets`、`src/locales` 或 `public`。如果新核心改变了文章契约，必须先通过构建和内容检查，再把站点升级提交到版本控制。
