# GameWikiTemplate

这是一个基于 Astro 的游戏 Wiki 与攻略站 starter。游戏身份、文章、图片、多语言内容和部署配置维护在本仓库中；通用框架代码由 [GameWikiCore](https://github.com/HaydenGuo/GameWikiCore) 提供。

## Core 边界

本 starter 将 `@hb-game-wiki/template` 固定在 GameWikiCore `v2.3.1`。

```text
GameWikiCore             通用组件、路由、样式与校验
        ↓ v2.3.1
GameWikiTemplate         Starter 配置与内容
        ↓ 定制
你的游戏站
```

Core 管理的目录由 `pnpm template:link` 链接，并由 `pnpm check-template-boundary` 检查。修改这条边界前，请先阅读 [docs/starter-boundary.md](docs/starter-boundary.md)。

## 本地运行

需要 Node.js 22 或更高版本，以及 pnpm。

```powershell
pnpm install
pnpm dev
```

要用具体游戏配置替换演示内容，请运行：

```powershell
pnpm apply-template
```

Cloudflare Pages 部署说明见 [docs/deployment.md](docs/deployment.md)；模板初始化说明见 [docs/apply-template.md](docs/apply-template.md)；撰写文章前请阅读 [docs/content-format.md](docs/content-format.md)。仓库文档索引见 [docs/README.md](docs/README.md)。

可按游戏气质选择四种全站标题字样式，见 [docs/art-typography.md](docs/art-typography.md)。

## 参与开发

修改模板代码前，请阅读 [AGENTS.md](AGENTS.md) 和 [docs/development.md](docs/development.md)，并按项目说明运行适用的验证命令。

## 许可

MIT，详见 [LICENSE](LICENSE)。

---

# GameWikiTemplate

An Astro starter for game wiki and guide sites. Site identity, articles, images, locales, and deployment settings live in this repository; shared framework code comes from [GameWikiCore](https://github.com/HaydenGuo/GameWikiCore).

## Core boundary

This starter pins `@hb-game-wiki/template` to GameWikiCore `v2.3.1`.

```text
GameWikiCore             Shared components, routes, styles, and validation
        ↓ v2.3.1
GameWikiTemplate         Starter configuration and content
        ↓ customize
Your game site
```

Core-owned directories are linked by `pnpm template:link` and checked by `pnpm check-template-boundary`. See [docs/starter-boundary.md](docs/starter-boundary.md) before changing the boundary.

## Local setup

Requirements: Node.js 22 or later and pnpm.

```powershell
pnpm install
pnpm dev
```

Run `pnpm apply-template` to replace the demo site with a game's configuration. See [docs/deployment.md](docs/deployment.md) for Cloudflare Pages setup, [docs/apply-template.md](docs/apply-template.md) for the initializer, and [docs/content-format.md](docs/content-format.md) for article authoring. The documentation index is [docs/README.md](docs/README.md).

## Contributing

Read [AGENTS.md](AGENTS.md) and [docs/development.md](docs/development.md) before changing template code. Follow their relevant verification guidance.

## License

MIT. See [LICENSE](LICENSE).
