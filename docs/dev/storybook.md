# Storybook Workflow

This project uses [Storybook](https://storybook.js.org/) with the Vite React renderer to document and test UI components.

## Running Storybook

```bash
npm run storybook
```

Story files live alongside their components using the `*.stories.tsx` naming convention. The configuration in `.storybook/main.ts` automatically loads stories from `src/`.

## Visual Regression Testing

Chromatic publishes Storybook builds on each pull request. Provide the `CHROMATIC_PROJECT_TOKEN` secret in the repository settings. The workflow is defined in `.github/workflows/chromatic.yml` and runs automatically for PRs targeting `main`.

## Accessibility Tests

Playwright and `axe-core` run basic accessibility checks against key stories.

```bash
npm run test:a11y
```

The test file lives at `tests/a11y/storybook.spec.ts` and launches Storybook locally before auditing stories.
