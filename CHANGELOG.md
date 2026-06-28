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
- Added the first basic renderer with model path attributes, HTML serialization, docs, QA, and demo rendering.
- Added DOM/model point mapping helpers with jsdom-backed tests.
- Added browser selection/model selection sync helpers with jsdom and demo e2e coverage.
- Added selection sync documentation and QA records.
- Added the first React component API with `value`, `defaultValue`, `onChange`, renderer-backed output, docs, and demo examples.
- Added render closure coverage for empty documents, empty paragraphs, DOM mapping invalid inputs, React component boundaries, demo boundary examples, and week 4 QA.

### Changed

- Updated project, QA, package, and collaboration docs to match the completed model and selection scope.
- Updated package homepage metadata to use the `master` branch.
- Clarified contribution, model attrs, and selection demo inspector documentation.
- Updated project status docs for the completed basic renderer.
- Updated render docs for DOM/model point mapping.
- Updated project status docs for completed selection sync.
- Updated render docs and project status for the completed render closure.

### Not Included Yet

- Editing commands, history, parsing, document serialization, or real editing behavior.
