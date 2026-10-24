# 贡献指南 · Contributing

感谢你愿意改进 SafeMark！下面是参与开发需要了解的内容。
*Thanks for helping improve SafeMark! An English version follows the Chinese one.*

## 开发环境

- Node.js `^22.18` 或 `>=24.12`（见 `.nvmrc`）
- 推荐使用 VS Code 及 `.vscode/extensions.json` 中列出的插件（Vue、ESLint、Prettier）

```bash
npm install
npm run dev
```

## 提交前请确认

```bash
npm run lint          # ESLint
npm run format:check  # Prettier（npm run format 可自动修复）
npm run type-check    # vue-tsc
npm test              # 单元测试
npm run test:e2e      # 端到端测试（首次运行前执行 npx playwright install）
```

CI 会在每个 Pull Request 上运行以上检查。

## 几条约定

- **隐私是底线。** 不要引入任何会把数据发送到其他网站的代码或依赖（统计、字体 CDN、远程配置等），也不要放宽 `vite.config.ts` 中的内容安全策略。所有运行时资源都必须随应用一起部署。
- **预览与导出共用绘制代码。** 新的水印效果请实现在 `src/core/render.ts` 中，确保预览和导出结果一致。
- **尺寸用相对值。** 新增的尺寸类设置应以图片短边或字号为基准，而不是绝对像素。
- **界面文案需要中英双语。** 在 `src/i18n/zh-CN.ts` 中添加文案后，TypeScript 会要求在 `src/i18n/en.ts` 中补全对应的翻译。
- **新设置要经过校验。** 在 `src/core/config.ts` 中为新字段添加默认值、取值范围和 `normalizeConfig` 处理，旧版本保存的设置才能被安全读取。
- 核心逻辑（`src/core/`）尽量写成可测试的纯函数，并补充单元测试。

## 提交信息

建议使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 风格，例如 `feat: 支持 TIFF 图片`、`fix(pdf): 修复旋转页面的水印位置`。

## 发布

1. 更新 `package.json` 中的版本号和 `CHANGELOG.md`
2. 合并到 `main` 后会自动部署到 GitHub Pages
3. 创建对应的 Git 标签和 GitHub Release（例如 `v1.1.0`）

---

## Contributing (English)

### Setup

Node.js `^22.18` or `>=24.12` (see `.nvmrc`), then `npm install` and `npm run dev`.

### Before opening a pull request

Run `npm run lint`, `npm run format:check`, `npm run type-check`, `npm test` and
`npm run test:e2e` (run `npx playwright install` once first). CI runs the same checks.

### Ground rules

- **Privacy is non-negotiable.** Never add code or dependencies that send data to another origin
  (analytics, font CDNs, remote config…) and do not loosen the Content Security Policy in
  `vite.config.ts`. Every runtime asset must be shipped with the app.
- **Preview and export share one renderer.** Implement new watermark effects in
  `src/core/render.ts` so that what users see is what they get.
- **Use relative sizes.** New size settings should be relative to the image's shorter side or to
  the font size, not absolute pixels.
- **The UI is bilingual.** Add strings to `src/i18n/zh-CN.ts`; TypeScript then requires the
  English translation in `src/i18n/en.ts`.
- **Validate new settings.** Give new fields a default, limits and handling in `normalizeConfig`
  (`src/core/config.ts`) so settings saved by older versions load safely.
- Keep core logic in `src/core/` as testable pure functions, with unit tests.

Commit messages in the [Conventional Commits](https://www.conventionalcommits.org/) style are
appreciated, e.g. `feat: support TIFF images` or `fix(pdf): watermark position on rotated pages`.
