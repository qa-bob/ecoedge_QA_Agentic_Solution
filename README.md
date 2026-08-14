# Eco-Edge QA Agentic Solution

Automated regression test suite for [Eco-Edge](http://www.ecoedgeco.com/) — a B2B software company serving the transportation and mining industries.

Built with **Playwright + TypeScript** following the **Page Object Model (POM)** design pattern and **Object-Oriented Programming (OOP)** principles. [Claude Code](https://claude.ai/code) drives agentic test generation, site analysis, and test execution via built-in slash commands and sub-agents.

---

## Table of Contents

- [Project Purpose](#project-purpose)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Development Environment Setup](#development-environment-setup)
- [Running Tests](#running-tests)
- [Project Architecture](#project-architecture)
- [Claude Code Integration](#claude-code-integration)
- [Contributor Rules](#contributor-rules)

---

## Project Purpose

This repository contains a comprehensive GUI, functional, and regression test suite for `http://www.ecoedgeco.com/`. Tests cover all discoverable pages and features of the site **without requiring account creation, form submission, or authentication**.

**Test suites:**

| Suite | Tag | Description |
|-------|-----|-------------|
| Smoke | `@smoke` | Site availability, HTTP status, title, console errors |
| Navigation | `@navigation` | Nav links, mobile menu, routing, accessible link text |
| Forms | `@forms` | Contact form structure, field validation, submit behavior |
| Functional | `@functional` | Business content, CTAs, interactive elements, page flows |
| Visual | `@visual` | Screenshot regression across desktop/tablet/mobile |
| Responsive | `@responsive` | Layout at mobile/tablet/desktop breakpoints |

---

## Technology Stack

| Tool | Version | Purpose |
|------|---------|---------|
| [Playwright](https://playwright.dev/) | ^1.44 | Browser automation and test runner |
| TypeScript | ^5.4 | Strongly-typed test code |
| Node.js | 20+ | Runtime |
| GitHub Actions | — | CI/CD pipeline |
| [Claude Code](https://claude.ai/code) | — | Agentic test generation, site analysis, reporting |

---

## Prerequisites

- **Node.js** v20 or later — [nodejs.org](https://nodejs.org/)
- **npm** v9 or later (bundled with Node)
- **Git**
- Network access to `http://www.ecoedgeco.com/` (tests run against the live site)

> **Note:** The current site URL uses HTTP. The smoke test suite will flag this as a finding.
> To test a staging environment, set the `SITE_URL` environment variable (see below).

---

## Development Environment Setup

### 1. Clone the repository

```bash
git clone https://github.com/<org>/ecoedge_QA_Agentic_Solution.git
cd ecoedge_QA_Agentic_Solution
```

### 2. Install Node dependencies

```bash
npm install
```

### 3. Install Playwright browsers

Chromium only (fastest, covers most CI runs):

```bash
npx playwright install --with-deps chromium
```

Full cross-browser install (optional, for complete coverage):

```bash
npx playwright install --with-deps
```

### 4. Verify TypeScript compiles

```bash
npm run typecheck
```

There should be zero errors before you run tests or open a PR.

### 5. Copy the environment template (optional)

```bash
cp .env.example .env
```

Edit `.env` to override `SITE_URL` when testing a staging environment.

### 6. Confirm setup with the smoke suite

```bash
npm run test:smoke
```

All smoke tests should pass (or produce expected warnings for the HTTP finding).

---

## Running Tests

```bash
# Run the full suite
npm test

# Run by category
npm run test:smoke          # Site availability and health
npm run test:navigation     # Nav links, routing, mobile menu
npm run test:forms          # Contact form structure and validation
npm run test:visual         # Screenshot regression
npm run test:responsive     # Layout at all breakpoints

# Run with a visible browser window
npm run test:headed

# Open the interactive Playwright HTML report
npm run report

# Update visual baseline screenshots after a confirmed design change
npm run baseline

# TypeScript type check (run before every PR)
npm run typecheck

# ESLint
npm run lint
```

### Environment variable overrides

| Variable | Default | Purpose |
|----------|---------|---------|
| `SITE_URL` | Value in `site.config.json` | Override the target URL for staging |
| `CI` | unset | Set to `true` in CI — enables stricter retries and workers |

---

## Project Architecture

This project enforces the **Page Object Model (POM)** pattern throughout.

### OOP / POM rules

- Every page or major section has a dedicated class in `src/pages/`
- All page classes extend `BasePage` (`src/pages/base.page.ts`)
- Locators are `readonly Locator` properties declared on the class
- Page object methods perform **actions only** — they never call `expect()`
- Assertions live exclusively in test spec files (`tests/**/*.spec.ts`)
- Tests import `{ test, expect }` from `@fixtures/site.fixture`, never directly from `@playwright/test`

### Directory map

```
site.config.json              ← Target site URL and feature flags
playwright.config.ts          ← Playwright projects (desktop / mobile / tablet)
global-setup.ts               ← Pre-suite reachability check (runs once)
src/
  pages/
    base.page.ts              ← BasePage — shared helpers for all page objects
    home.page.ts              ← HomePage — hero, CTAs, headings
    navigation.page.ts        ← NavigationPage — nav links, mobile menu
    contact.page.ts           ← ContactFormPage — form discovery and field inspection
    <page>.page.ts            ← One class per additional discovered page
  fixtures/
    site.fixture.ts           ← Custom Playwright fixtures exposing page objects
  utils/
    link-checker.ts           ← Link reachability helpers
    visual-helper.ts          ← Cookie banner dismissal, screenshot helpers
  types/
    site-config.types.ts      ← SiteConfig interface and JSON loader
tests/
  smoke/                      ← @smoke
  navigation/                 ← @navigation
  forms/                      ← @forms
  functional/                 ← @functional
  visual/                     ← @visual
  responsive/                 ← @responsive
  custom/                     ← @custom  (generated by test-generator agent)
.claude/
  agents/                     ← Claude Code sub-agent definitions
  commands/                   ← Claude Code slash commands
  hooks/                      ← Shell hooks referenced from settings.json
  settings.json               ← Permissions and hook wiring for Claude Code
.github/
  workflows/playwright.yml    ← GitHub Actions CI pipeline
  ISSUE_TEMPLATE/             ← Bug report and feature request templates
  PULL_REQUEST_TEMPLATE.md    ← PR checklist for contributors
  CONTRIBUTING.md             ← Full contributor guide
```

### Configuration

`site.config.json` controls all feature flags. Edit it when the site structure changes:

| Field | Type | Purpose |
|-------|------|---------|
| `url` | string | Root URL of the site under test |
| `name` | string | Company name (used in test output and reports) |
| `hasContactForm` | boolean | Enable / disable the `@forms` suite |
| `expectedNavItems` | string[] | Nav link labels to verify in navigation tests |
| `skipVisual` | boolean | Skip visual regression for animated/random sites |
| `skipForms` | boolean | Skip form tests for auth-gated sites |
| `viewports` | string[] | Active viewport breakpoints |
| `auth.required` | boolean | Enable authenticated test flows |

---

## Claude Code Integration

This repo is purpose-built for [Claude Code](https://claude.ai/code) agentic operation.

| Reference | Purpose |
|-----------|---------|
| [`CLAUDE.md`](./CLAUDE.md) | Primary instructions for Claude Code in this repo |
| [`AGENTS.md`](./AGENTS.md) | Sub-agent reference (site-analyzer, test-generator) |
| [`Skills.md`](./Skills.md) | Slash command reference |
| [`.claude/settings.json`](./.claude/settings.json) | Permissions and hook configuration |

### Slash command quick reference

| Command | What it does |
|---------|-------------|
| `/analyze-site` | Crawl the live site; update `site.config.json`; report issues |
| `/generate-full-suite` | Analyze the site and generate a complete POM + test suite |
| `/run-smoke` | Run `@smoke` tests and display pass/fail summary |
| `/update-baseline` | Refresh visual regression baseline screenshots |
| `/generate-report` | Parse `test-results/results.json` and display a formatted summary |

---

## Contributor Rules

See [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) for the full guide. Key rules:

1. **Never submit forms** — test field interactions and validation only
2. **Never hardcode URLs** — always use `baseURL` from the Playwright config
3. **Import from the fixture** — `import { test, expect } from '@fixtures/site.fixture'`
4. **Tag every test** — at least one of `@smoke`, `@navigation`, `@forms`, `@functional`, `@visual`, `@responsive`
5. **No assertions in page objects** — `expect()` belongs in spec files only
6. **TypeScript must compile** — run `npm run typecheck` before opening a PR
7. **New pages get new POM classes** — add to `src/pages/`, extend `BasePage`
8. **One `describe` block per page or feature** — keep spec files focused
9. **All PRs target `main`** — CI runs automatically on push and PR
