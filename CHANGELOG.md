# Changelog

All notable changes to this project will be documented in this file.

The format follows the spirit of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses Conventional Commits for commit messages.

## Unreleased

### Added

- Initialized pnpm workspace layout for `packages/core`, `packages/react`, and `apps/demo`.
- Added TypeScript, tsup, Vite, Vitest, Playwright, ESLint, Prettier, commitlint, lint-staged, and Git hooks.
- Added GitHub Actions CI, Issue templates, PR template, CODEOWNERS, and Dependabot config.
- Added MIT license, contribution guide, security policy, initialization flow, and scaffold QA docs.
- Added the first document model with factories, type guards, validation, normalize, docs, QA, and demo JSON output.
- Added the first model selection API with Path, Point, RangeSelection, text range extraction, text range splitting, docs, QA, and demo inspector.
- Added a React editor shell component and wired it into the demo shell.
- Added model demo controls for example switching, validation status, and normalize verification.
- Added selection JSON node highlighting in the demo inspector.
- Added week 2 and week 3 QA records for model and selection milestones.
- Added schema tests for unknown node types and invalid document child normalization.

### Changed

- Updated project, QA, package, and collaboration docs to match the completed model and selection scope.
- Updated package homepage metadata to use the `master` branch.
- Clarified contribution, model attrs, and selection demo inspector documentation.

### Not Included Yet

- React rich text editor component logic beyond the empty shell.
- Editing commands, history, parsing, serialization, DOM mapping, browser selection sync, or rendering behavior.
