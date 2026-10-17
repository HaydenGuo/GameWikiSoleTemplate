# GameWikiSoleTemplate 工作流契约

这份文档把模板复制、功能接入、质量验收和发布拆成可观察的四层。它不替代文章 schema，也不把某个游戏、域名或广告账户写进通用模板。

## 四层证据

| 层 | 证明什么 | 最小证据 |
|---|---|---|
| Static | 源码和输入契约可通过检查 | `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm check-config`、`pnpm check-content` |
| Artifact | 构建产物包含正确路由、资源和配置 | `pnpm build`、`pnpm check-links`、HTML/manifest 检查 |
| Runtime | 浏览器中的交互和功能真的工作 | 本地启动、代表页面、consent 前后网络、正常/空/失败状态 |
| External | 外部平台状态已改变并可观察 | Git commit/push、Vercel `READY`、canonical/robots/sitemap、平台请求 |

高层证据不能替代低层证据。`build` 成功不等于页面答案正确，HTTP 200 不等于广告已填充，provider 请求 200 也不等于广告平台已产生 impression。

## 旧资料清理流程

清理旧品牌、过期说明、演示文章或平台数据时，用一份短清单记录命中路径、过期依据和处理方式（更新、草稿/取消发布、删除、保留为历史）。只有存在不确定性或依赖较多时，才扩展清单记录依赖细节。

先确认必须保留的资料，例如用户提供的联系信息、测试配置、许可证归属，以及解释历史决策的 PRD/CHANGELOG。没有新来源可核实的时效性事实，应退出发布内容；不要只改日期来制造“已更新”的表象。归档资料可以保留旧名称和日期，但不得被活动页面或当前指南误当作现行信息。

只追查被删除或取消发布内容的实际引用（导航、首页卡片、内链、生成清单和相关测试），并在同一 PR 中处理。完成最后一次内容或链接编辑后，按顺序执行：

1. 运行受影响的检查；明确删除模板文件时同步核对 `template-baseline.json`。
2. 重新执行 `pnpm build`，随后执行 `pnpm check-links`，确保链接审计使用最新的 `dist/`。
3. 检查最终 diff 和文件清单；通过后再推 PR。等待 CI 和现有 Vercel 项目预览完成。失败时按具体日志修复同一 PR。
4. 合并后按 `docs/development.md` 发版，并确认生产部署及受影响路径。

PR 摘要按清单简要说明各项处理和保留项，不必另做一份重复报告。

## 三层项目结构

```text
Code       可复用组件、页面壳、校验器
Config     游戏身份、域名、功能开关、provider 环境变量名
Content    文章、翻译、封面、来源和页面问题答案
```

复制模板后，先通过 `pnpm apply-template` 完成身份替换，再建立 `docs/template-baseline.json`。后续每批改动都必须先通过 `pnpm template-baseline:check`，明确删除必须登记最小路径和原因。

## 功能模块契约

一个功能模块至少包含四项：

1. 配置字段和环境变量名；
2. 组件/运行时代码；
3. 静态和运行时测试；
4. 正常、加载、空结果、失败和禁用状态的验收条件。

例如广告模块必须分别记录：consent gate、provider request、creative fill、layout-space removal 和平台 impression。不能只写“页面出现广告”。

## 发布契约

站点复制到实际项目后，将 `site.publish.example.json` 复制为 `site.publish.json` 并填写真实目标。`publishPaths` 必须同时覆盖：

- 新增和修改的源码、配置、测试；
- 明确删除的旧文件；
- 发布配置本身。

在提交前运行：

```powershell
pnpm check-publish-scope
```

它会读取 `git status`，把 modified/added/deleted 文件逐一和 `publishPaths` 比较。范围外的脏文件必须保留在工作树中，不得用 `git add .` 带入发布。

## 环境变量同步

`envSync` 只登记变量名、来源环境变量名、目标环境和是否敏感，不保存值：

```json
{
  "name": "PUBLIC_YOURGAME_ADSTERRA_KEY_NATIVE",
  "sourceEnv": "PUBLIC_YOURGAME_ADSTERRA_KEY_NATIVE",
  "target": ["production"],
  "sensitive": false
}
```

公开 ad-unit key 可以标记为 `sensitive: false`；token、数据库连接串和 OAuth 凭据不得进入模板、报告或 Git。

每个派生站点必须使用自己的前缀，例如 `PUBLIC_BOMBANANA_ADSTERRA_*` 或 `NEXT_PUBLIC_WARDOGS_ADSTERRA_*`。禁止使用无站点前缀的共享变量，禁止在广告组件中为缺失 key 回退到另一个站点；缺失当前站点 key 时应禁用当前广告单元并让检查失败。

## 固定交接字段

每次 Stage 4–6 交接至少记录：

```text
status / scope / evidence / blocked_by / next_action
template baseline / allowed deletions
publish paths / staged files / deleted files
env sync result / commit / deployment / live URLs
```

缺少证据时使用 `NEEDS_INPUT`、`PARTIAL` 或 `BLOCKED`，不能用“已执行”替代“已验证”。
