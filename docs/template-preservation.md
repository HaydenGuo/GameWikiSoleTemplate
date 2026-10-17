# Template preservation contract

模板项目允许被换成不同的游戏，但不能在开发中无意丢失原有的模板能力、组件、页面壳、校验脚本或配置字段。

## 三类变更

| 类型 | 允许方式 | 例子 |
| --- | --- | --- |
| 保留 | 默认保留，正常修改实现细节 | Layout、Header、Footer、文章渲染、SEO、搜索、错误状态、校验脚本 |
| 替换 | 可以替换，但要保持契约 | 游戏名称、品牌色、导航文案、文章正文、封面、视频 ID、域名 |
| 删除 | 只能显式登记 | 不适用当前游戏的 demo 类别、某个模板页面或资源 |

“替换”不等于“整文件重写”。改 `src/locales/en.json`、`src/config/site.ts` 或首页时，先读取当前文件，保留未涉及的字段和模块；只有确认不需要的字段才删除。

## 开发流程

复制模板或运行 `apply-template` 完成初始清理后，先建立一次基线：

```text
pnpm template-baseline:create
```

开发过程中，每完成一批页面、配置或视觉改动就执行：

```text
pnpm template-baseline:check
pnpm check-config
pnpm check-content
pnpm build
```

基线检查阻止“原有文件消失”和 locale JSON 的必要结构路径消失，不会阻止正常的改名、换文案、改样式或新增页面。检查失败时，先判断是：

1. AI 重写文件时漏掉了原内容：从当前模板副本恢复并重新做增量修改；
2. 这个删除确实是换站所需：在 `docs/template-baseline.json` 的 `allowed_deletions` 中加入最小路径，并在交接记录原因；
3. 删除的是生成物：确认它属于检查器忽略的构建、缓存或临时目录，而不是源码。

不要为了让检查通过而重新生成一份更小的基线。基线代表“开始本轮开发时真实存在的模板”，不是开发结束后的理想状态。

显式删除使用对象格式，不能只写路径：

```json
{
  "allowed_deletions": [
    {
      "path": "src/content/wiki/en/demo-category/**",
      "reason": "该 demo 分类不属于当前游戏，已由 Stage 3 的 guides 分类替代"
    }
  ]
}
```

## 交接证据

Stage 4 报告必须记录：

- 基线文件路径和建立时间；
- 删除文件数量；
- 每个显式删除的路径、原因和替代模块；
- `template-baseline:check`、`check-config`、`check-content` 和 `build` 的结果。

即使页面正文全部换成新游戏内容，也要分别证明模板的代码层、页面壳、导航/配置契约和内容层没有因整文件覆盖而丢失。

## 与发布范围的关系

模板基线保护“原有模板能力没有被静默删除”；发布范围保护“本次提交没有把无关工作树修改带入远端”。两者是不同闸门，必须同时通过：

```text
template-baseline:check  →  模板文件保真
check-publish-scope       →  Git modified/added/deleted 范围
```

删除旧文件时，两处都要留下证据：基线的 `allowed_deletions` 记录删除原因，`site.publish.json` 的 `publishPaths` 覆盖该删除路径。详见 [工作流契约](./workflow-contract.md) 和 `site.publish.example.json`。
