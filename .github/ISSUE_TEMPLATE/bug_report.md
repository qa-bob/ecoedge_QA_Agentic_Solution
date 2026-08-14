---
name: Bug Report
about: A test is failing, incorrect, or producing misleading results
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug description

<!-- Clear, one-sentence description of what went wrong. -->

## Affected test(s)

| Test file | Test name | Tag |
|-----------|-----------|-----|
| `tests/...` | | `@` |

## Steps to reproduce

1. Run `npm run test:<suite>` (or `npx playwright test <file>`)
2. Observe: ...

## Expected behavior

<!-- What should have happened? -->

## Actual behavior

<!-- What actually happened? Paste the error output or diff. -->

```
<paste Playwright error output here>
```

## Environment

- **OS:** <!-- e.g. Windows Server 2022 / macOS 14 / Ubuntu 22.04 -->
- **Node version:** <!-- `node --version` -->
- **Playwright version:** <!-- `npx playwright --version` -->
- **Site URL tested:** <!-- e.g. http://www.ecoedgeco.com or staging URL -->
- **Browser/project:** <!-- chromium-desktop / mobile-chrome / tablet -->

## Possible cause (optional)

<!-- Selector changed? Site structure changed? Timing issue? -->

## Screenshots / logs (optional)

<!-- Attach `playwright-report/` or paste relevant console output. -->
