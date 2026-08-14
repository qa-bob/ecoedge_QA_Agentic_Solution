# AGENTS.md — Claude Code Sub-Agent Reference

This file documents the Claude Code sub-agents available in this repository under `.claude/agents/`.

Sub-agents are specialized AI workers invoked by Claude Code to perform focused, well-scoped tasks.
They are defined as Markdown files with YAML frontmatter that tells Claude Code their name, purpose,
and model preference.

---

## How sub-agents work in this repo

Claude Code reads the agents in `.claude/agents/` and may invoke them automatically when a task
fits their description, or explicitly when a slash command delegates to one. Contributors do not
invoke agents directly — that is Claude Code's responsibility.

---

## site-analyzer

**File:** `.claude/agents/site-analyzer.md`
**Model:** `claude-sonnet-4-6`
**Invoked by:** `/analyze-site`, `/generate-full-suite`

### Purpose

Crawls the live Eco-Edge website and produces a fully-populated `site.config.json`. Use this agent
when onboarding a new site or after a redesign to refresh stale configuration.

### Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `url` | Yes | Target URL — defaults to value in `site.config.json` |
| `companyName` | No | Company name override (otherwise inferred from `<title>`) |

### Outputs

- Updated `site.config.json` JSON block with all fields populated
- Issues Found checklist (missing HTTPS, missing meta description, broken nav links, etc.)
- Confidence assessment (High / Medium / Low)

### Step-by-step behavior

1. Issue a HEAD request to resolve redirects and get the canonical URL
2. Navigate with `waitUntil: 'networkidle'` — wait an extra 2s for SPAs
3. Dismiss cookie banners before inspecting structure
4. Extract nav items from `nav a[href]` and `[role="navigation"] a[href]`
5. Detect contact forms on the homepage and at common paths (`/contact`, `/contact-us`)
6. Infer industry from `<h1>`, `<h2>`, and `<p>` content
7. Set `skipVisual: true` only if the site has unpaused CSS animations or rotating content
8. Set `auth.required: true` if any page redirects to a login URL

---

## test-generator

**File:** `.claude/agents/test-generator.md`
**Model:** `claude-sonnet-4-6`
**Invoked by:** `/generate-full-suite`, ad-hoc test generation requests

### Purpose

Reads a populated `site.config.json` and generates site-specific Playwright test files for features
not already covered by the shared test suites. Output files land in `tests/custom/`.

### Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `siteConfig` | Yes | Populated `site.config.json` |
| `testScenarios` | No | Specific scenarios to cover |
| `pagesToTest` | No | Specific page paths (e.g. `/services`, `/about`) |

### Outputs

TypeScript spec files at `tests/custom/<feature-name>.spec.ts` that:
- Import from `@fixtures/site.fixture`
- Tag tests with `@custom` plus one standard suite tag
- Follow all POM conventions (new selectors in page objects, not inline in specs)
- Include a JSDoc header explaining what is being tested and why it is site-specific

### Step-by-step behavior

1. Read and parse `site.config.json`
2. Identify pages in `expectedNavItems` that lack dedicated tests
3. Detect unique interactive elements (pricing calculators, video embeds, accordions)
4. Plan test scenarios and output the list before writing code
5. Add any new locators to the appropriate page object in `src/pages/`
6. Write spec file(s) following the framework conventions
7. Validate mentally: each test is independent, uses proper waits, has a clear assertion

---

## Writing new agents

Add a Markdown file to `.claude/agents/<agent-name>.md` with this frontmatter:

```markdown
---
name: agent-name
description: One-sentence description of when Claude Code should invoke this agent.
model: claude-sonnet-4-6
---

# Agent: agent-name

## Role
...

## When to invoke
...

## Step-by-step instructions
...
```

The `description` field is used by Claude Code to decide when to invoke the agent automatically.
Keep it specific and action-oriented so Claude does not invoke it for unrelated tasks.

---

## Agent model selection guide

| Scenario | Recommended model |
|----------|------------------|
| Site crawling, config generation, test generation | `claude-sonnet-4-6` |
| Complex reasoning, architecture decisions | `claude-opus-4-8` |
| Simple extraction tasks, quick checks | `claude-haiku-4-5-20251001` |
