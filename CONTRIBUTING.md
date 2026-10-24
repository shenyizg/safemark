# Contributing

English · [简体中文](CONTRIBUTING.zh-CN.md)

Thanks for helping improve SafeMark! Here is what you need to know to work on it.

## Setup

- Node.js `^22.18` or `>=24.12` (see `.nvmrc`)
- VS Code with the extensions listed in `.vscode/extensions.json` (Vue, ESLint, Prettier) is recommended

```bash
npm install
npm run dev
```

## Before opening a pull request

```bash
npm run lint          # ESLint
npm run format:check  # Prettier (npm run format fixes it)
npm run type-check    # vue-tsc
npm test              # unit tests
npm run test:e2e      # end-to-end tests (run npx playwright install once first)
```

CI runs the same checks on every pull request.

## Ground rules

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

## Commit messages

Commit messages in the [Conventional Commits](https://www.conventionalcommits.org/) style are
appreciated, e.g. `feat: support TIFF images` or `fix(pdf): watermark position on rotated pages`.

## Releasing

1. Update the version in `package.json` and add an entry to `CHANGELOG.md`.
2. Merging into `main` deploys the site to GitHub Pages automatically.
3. Create the matching Git tag and GitHub release (e.g. `v1.1.0`).
