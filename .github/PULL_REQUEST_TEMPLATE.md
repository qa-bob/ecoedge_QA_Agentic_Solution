## Description

<!-- Briefly describe what this PR adds or changes. Link to the issue if applicable. -->

## Type of change

- [ ] New test(s)
- [ ] New page object(s)
- [ ] Bug fix (test was incorrect or failing)
- [ ] Framework improvement (config, utilities, CI)
- [ ] Baseline update (visual regression screenshots)
- [ ] Documentation

## Test coverage added / changed

<!-- List the spec files added or modified and what they cover. -->

| File | Tags | What it tests |
|------|------|--------------|
| `tests/...` | `@` | |

## Pre-merge checklist

- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes
- [ ] All new tests carry at least one suite tag (`@smoke`, `@navigation`, `@forms`, `@functional`, `@visual`, `@responsive`)
- [ ] No hardcoded base URLs — `baseURL` / `siteConfig.url` used throughout
- [ ] No `page.waitForTimeout()` — Playwright auto-waiting used instead
- [ ] No `expect()` calls inside page object methods
- [ ] All test files import from `@fixtures/site.fixture`, not `@playwright/test`
- [ ] New page objects extend `BasePage` and are registered in `src/fixtures/site.fixture.ts`
- [ ] Forms are not submitted in any test
- [ ] No accounts created or credentials entered

## Screenshots / evidence (optional)

<!-- Attach test run output, HTML report screenshot, or before/after if relevant. -->
