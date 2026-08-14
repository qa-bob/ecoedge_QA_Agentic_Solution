# Skills.md — Claude Code Slash Command Reference

This file documents the slash commands (skills) available in this repository under `.claude/commands/`.

Slash commands are invoked in Claude Code using the `/command-name` syntax. Each `.md` file in
`.claude/commands/` becomes one command. The filename (without `.md`) is the command name.

---

## /analyze-site

**File:** `.claude/commands/analyze-site.md`

Crawl the live site and analyze its structure. Refreshes `site.config.json` with real values
discovered from the live site and reports issues found.

**Usage:**
```
/analyze-site
/analyze-site https://staging.ecoedgeco.com
```

**What it checks:**
- Page `<title>` and meta description
- Primary navigation links (text + href)
- Contact form presence (`<form>` with email field)
- HTTPS usage
- Favicon presence
- Viewport meta tag
- Horizontal overflow at 390px (mobile responsiveness)
- Nav links for 404s

**Output:** Completed `site.config.json` block + Issues Found checklist + confidence rating.

---

## /generate-full-suite

**File:** `.claude/commands/generate-full-suite.md`

Analyze the live site and generate a complete Page Object Model + test suite from scratch.
Delegates to the `site-analyzer` agent to inspect the site, then to the `test-generator` agent
to write spec files for each discovered page and feature.

**Usage:**
```
/generate-full-suite
```

**What it generates:**
- Page object classes in `src/pages/` for each discovered page
- Test spec files in `tests/custom/` for site-specific features
- Updated `site.config.json` with all discovered values

**Output:** Summary of created/updated files, TypeScript compile check result.

---

## /run-smoke

**File:** `.claude/commands/run-smoke.md`

Run the `@smoke` test suite and display a clean pass/fail summary with failure details and
suggested fixes for common failure patterns.

**Usage:**
```
/run-smoke
```

**Output:** Formatted results table with per-test status, duration, and failure details.

---

## /update-baseline

**File:** `.claude/commands/update-baseline.md`

Refresh all visual regression baseline screenshots after a confirmed intentional design change.
Runs `playwright test --grep @visual --update-snapshots` and reports which files changed.

**Usage:**
```
/update-baseline
```

**When to run:**
- After a deliberate site redesign or content update
- After changing viewport sizes in `playwright.config.ts`
- When onboarding a new site (first-time baseline capture)

**Output:** List of updated snapshot files + reminder to review before committing.

---

## /generate-report

**File:** `.claude/commands/generate-report.md`

Parse `test-results/results.json` and display a formatted test run summary — pass rates by
suite, all failures with error messages, flaky tests, and suggested next steps.

**Usage:**
```
/generate-report
```

**Output:** Suite-level table + failure details + actionable suggestions.

---

## Adding new slash commands

Create a Markdown file at `.claude/commands/<command-name>.md`. The filename becomes the slash
command name. Use this structure:

```markdown
# /command-name

One-sentence description of what this command does.

## Usage

\`\`\`
/command-name [optional-args]
\`\`\`

## What this command does

1. Step one
2. Step two
3. ...

## Output format

What the user sees back.

## Notes

Edge cases and caveats.
```

The file is read by Claude Code when you type `/command-name` in the chat. Keep instructions
concrete and step-by-step — they are executed by the model, not a script.

---

## Skill / command relationship to agents

Some commands delegate heavy lifting to sub-agents defined in `.claude/agents/`:

| Command | Delegates to |
|---------|-------------|
| `/analyze-site` | `site-analyzer` agent |
| `/generate-full-suite` | `site-analyzer` → `test-generator` agents |
| `/run-smoke`, `/update-baseline`, `/generate-report` | Bash tools directly |

See [`AGENTS.md`](./AGENTS.md) for sub-agent documentation.
