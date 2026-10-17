# GameWikiSoleTemplate

这是一个基于 Astro 的游戏 Wiki 与攻略站 starter。游戏身份、文章、图片、多语言内容和部署配置维护在本仓库中；通用运行时代码、站点配置、示例内容和开发工具都在本仓库中。

## 单仓库源码

本 starter 将通用运行时代码与站点模板维护在同一仓库。

```text
GameWikiSoleTemplate
├── 通用运行时：src/components、src/pages、src/lib、src/i18n、src/styles
├── Starter 配置：src/config、src/locales、wrangler.toml
└── 示例内容：src/content、src/assets、public
```

所有代码均为本仓库内的普通源码文件。目录说明见 [docs/starter-boundary.md](docs/starter-boundary.md)。

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

# GameWikiSoleTemplate

A single-repository Astro starter for game wiki and guide sites. Runtime code, site configuration, example content, and development tooling live together here.

## Single-source codebase

This starter keeps its reusable runtime and site template in one repository.

```text
GameWikiSoleTemplate
├── Reusable runtime: src/components, src/pages, src/lib, src/i18n, src/styles
├── Starter configuration: src/config, src/locales, wrangler.toml
└── Example content: src/content, src/assets, public
```

All source directories are ordinary tracked files in this repository. See [docs/starter-boundary.md](docs/starter-boundary.md) for the source layout.

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
