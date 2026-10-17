# 通用首页 GA4 点击埋点设计

## 目标

把已在线上验证过的首页点击事件能力，抽象为 AnvilWiki 模板的通用、可选功能。新站只有在配置 `PUBLIC_GA_ID` 且访客同意 Analytics 后才发送数据；模板不得携带任何具体游戏的域名、内容或 Measurement ID。

## 方案

沿用首页元素的 `data-home-slot` / `data-home-item` 标记，由 `HomePage.astro` 的一个客户端脚本统一监听，再调用 `src/lib/homepage-analytics.ts`。`BaseLayout.astro` 在 Consent loader 完成 GA 初始化后暴露 `window.gtag` 和 `window.__awAnalyticsReady`。Helper 在未同意、GA 未配置或 loader 尚未就绪时返回 `false`，不抛错。

## 事件契约

事件名称固定为 `homepage_nav_click`，参数为：

- `slot`：`hero_primary`、`hero_secondary`、`quick_start`、`recent_updates_browse_all`、`recent_update`、`popular`、`explore` 或 `closing_cta`
- `item`：通用语义 ID 或数据驱动的卡片标题，不写入具体站点常量
- `target_path`：点击目标的 pathname
- `variant`：当前固定为 `home-v1`
- `locale`：当前页面语言

## 影响范围

- 修改 `src/components/layout/BaseLayout.astro`、`src/components/home/HomePage.astro`
- 新增 `src/lib/homepage-analytics.ts`、`tests/homepage-analytics.test.ts`
- 扩展 `tests/apply-template.test.ts` 与 `scripts/e2e-apply-template.mjs`，验证生成站保留通用事件能力且默认空 GA 配置不输出追踪脚本
- 更新 GA4 使用文档，说明 Consent、事件名称和 Realtime 验证方式

## 验收

运行 `pnpm test`、`pnpm typecheck`、`pnpm lint`、`pnpm check-config`、`pnpm check-content`、`pnpm check-i18n --strict-ui`、`pnpm build`、`pnpm check-links` 和 `pnpm test:e2e`。静态检查确认模板不含具体站点身份；生成站构建成功；配置合法 Measurement ID 并接受 Consent 后，GA4 Realtime 能显示 `homepage_nav_click`。
