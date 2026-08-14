# Contributing to the Eco-Edge QA Agentic Solution

This guide explains how to contribute tests, page objects, and framework improvements
to this Playwright + TypeScript regression suite.

---

## Table of Contents

- [Quick Setup](#quick-setup)
- [Branching and PR Flow](#branching-and-pr-flow)
- [Architecture Rules](#architecture-rules)
- [Writing Tests](#writing-tests)
- [Writing Page Objects](#writing-page-objects)
- [Test Tagging Reference](#test-tagging-reference)
- [Quality Checklist](#quality-checklist)
- [CI Requirements](#ci-requirements)

---

## Quick Setup

1. Fork and clone the repository
2. Run `npm install`
3. Run `npx playwright install --with-deps chromium`
4. Run `npm run typecheck` — must report zero errors
5. Run `npm run test:smoke` — all smoke tests should pass

See [`README.md`](../README.md) for full setup details.

---

## Branching and PR Flow

- **All PRs target `main`**
- Branch naming: `feat/<description>`, `fix/<description>`, `test/<description>`
- One logical change per PR — keep diffs reviewable
- Fill in the PR template checklist completely
- CI must pass before a PR can be merged (`npm run typecheck` + `npm test`)

---

## Architecture Rules

### Do not

- Submit any form — test field interactions and validation only
- Create accounts or log in (unless `auth.required: true` in config)
- Hardcode the base URL in tests — always use `baseURL` from the Playwright config
- Put `expect()` calls inside page object methods
- Use `page.waitForTimeout()` — use `waitForSelector` or Playwright auto-waiting instead
- Use `any` type without explicit justification
- Import `{ test, expect }` from `@playwright/test` — always import from `@fixtures/site.fixture`

### Page Object Model

- Every page or major section gets a dedicated class in `src/pages/`
- All page classes extend `BasePage` (`src/pages/base.page.ts`)
- Locators are `readonly Locator` properties declared on the class
- Methods represent **user actions** (navigate, click, fill) — never assertions
- Update `src/fixtures/site.fixture.ts` to expose any new page object classes

### TypeScript

- Strict mode is enabled — no implicit `any`, no `!` without justification
- All page object properties must be typed
- Run `npm run typecheck` and fix all errors before opening a PR

---

## Writing Tests

### File location

| Test type | Directory | Tag |
|-----------|-----------|-----|
| Availability / health | `tests/smoke/` | `@smoke` |
| Navigation / routing | `tests/navigation/` | `@navigation` |
| Form fields / validation | `tests/forms/` | `@forms` |
| Business features | `tests/functional/` | `@functional` |
| Screenshot regression | `tests/visual/` | `@visual` |
| Responsive layout | `tests/responsive/` | `@responsive` |
| Site-specific custom | `tests/custom/` | `@custom` |

### Required import

```typescript
import { test, expect } from '@fixtures/site.fixture';
```

### Test structure

```typescript
test.describe('Feature Name @tag', () => {
  test.beforeEach(async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
  });

  test('describes what should be true @tag', async ({ page }) => {
    // arrange (via page object or fixture)
    // act (optional)
    // assert
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### Rules for test content

- Test names describe observable behavior — not implementation
- One logical assertion per test where possible
- Use `test.skip()` with a message when a feature is conditionally absent (not `test.only`)
- Console warnings (`console.warn`) are acceptable for soft findings; hard `expect()` failures must be genuine defects
- Never rely on test execution order — each test must be independent

---

## Writing Page Objects

### Template

```typescript
/**
 * src/pages/example.page.ts
 *
 * ExamplePage models the /example route.
 */

import { type Locator } from '@playwright/test';
import { BasePage } from '@pages/base.page';

export class ExamplePage extends BasePage {
  // Declare all locators as readonly properties
  readonly heading: Locator;
  readonly ctaButton: Locator;

  // Override navigate() if the page is not at the root URL
  async navigateToExample(): Promise<void> {
    await this.page.goto(
      this.url.replace(/\/$/, '') + '/example',
      { waitUntil: 'domcontentloaded' }
    );
  }

  // Action methods only — no expect() here
  async clickCta(): Promise<void> {
    await this.ctaButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
```

After creating the class, register it in `src/fixtures/site.fixture.ts`.

---

## Test Tagging Reference

Every test must carry **at least one** of these tags:

| Tag | Purpose |
|-----|---------|
| `@smoke` | Site loads, title present, no critical console errors |
| `@navigation` | Nav links, routing, mobile menu, breadcrumbs |
| `@forms` | Form fields, validation, accessibility attributes |
| `@functional` | Business features: pricing, search, video, accordion, CTAs |
| `@visual` | Screenshot regression with `toHaveScreenshot()` |
| `@responsive` | Viewport-specific layout checks |
| `@custom` | Site-specific tests generated for Eco-Edge |

Run a single tagged suite: `npx playwright test --grep @functional`

---

## Quality Checklist

Before opening a PR, verify:

- [ ] `npm run typecheck` reports zero errors
- [ ] `npm run lint` passes
- [ ] New tests are tagged with at least one suite tag
- [ ] New page objects extend `BasePage` and have no `expect()` calls
- [ ] No hardcoded URLs — `baseURL` or `siteConfig.url` used throughout
- [ ] No `page.waitForTimeout()` calls — Playwright auto-waiting used instead
- [ ] All new test files import from `@fixtures/site.fixture`
- [ ] PR description explains what was added/changed and why

---

## CI Requirements

The GitHub Actions workflow (`.github/workflows/playwright.yml`) runs on every push and PR:

1. `npm run typecheck` — TypeScript must compile
2. `npm run lint` — ESLint must pass
3. `npm test` — Full Playwright suite against the live site

A PR cannot be merged if CI fails. Check the Actions tab for failure details.

---

## Getting Help

Open an issue using the **Bug Report** template if you find a defect, or the **Feature Request**
template to propose new test coverage or framework improvements.
