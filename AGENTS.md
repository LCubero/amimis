# Repository Guidelines

## Project and Sources
Amimis is a mobile-first sleep-time calculator built with vanilla TypeScript,
Vite 7, and CSS. It requires a build; do not serve the TypeScript source with a
plain static server.

- `index.html`: app shell, accessible form, collapsible options, and result.
- `src/app.ts`: UI events, validation, URL sync, localStorage, and themes.
- `src/time.ts`: pure time/duration utilities and wake-time normalization.
- `src/i18n.ts`: ES/EN copy and language persistence.
- `src/styles.css`: theme tokens, contrast, and responsive layout.
- `tests/`: Playwright CLI scripts, not standalone Node test files.
- `.playwright/cli.config.json`: shared isolated, headless Chromium settings.
- `docs/harness-readiness.md`: technical baseline, constraints, and harness preparation.

## Install, Run, and Verify
Use a Node.js version supported by Vite 7 (`^20.19.0 || >=22.12.0`).

```bash
npm ci
npm run dev
npm run typecheck
npm run build
```

The app URL is `http://localhost:4173/amimis/`. The production base is `/amimis/`.
For browser checks, follow the full Playwright setup and commands in `README.md`.
Run all four scripts: `visual-checks.js`, `preferences-contrast.js`,
`mobile-editing.js`, and `theme-reload.js` under `tests/`.
No npm test script or Jest/Vitest runner is configured. Build output is `dist/`.

## Coding and Behavior
- Use 2-space indentation, ES modules, named exports, and camelCase identifiers.
- Keep time helpers pure; keep DOM and persistence in `src/app.ts`.
- Preserve URL values and versioned localStorage keys/shapes.
- Wake time is editable text accepting 24h and AM/PM; normalize to `HH:mm` for calculation, links, and storage.
- Language and theme persist independently of the remember-form checkbox; clearing the form keeps both preferences.
- Keep labels, validation states, focus indication, and reduced-motion behavior accessible.
- Prioritize compact mobile results. Check result position and total height, not only horizontal overflow.
- Preserve 44px touch targets and measured contrast in both themes.

## Documentation and Harness
The product README is in Spanish; preserve that convention. Code, identifiers,
and commit messages are English. Update docs alongside behavior.

The repository harness is installed for Pi. Follow `REPO-HARNESS.md` and use
`docs/repo-harness/README.md` for documentation ownership. Installation choices
and their scope live in `docs/repo-harness/decisions.md`; future changes need
their own applicable approval.

This `AGENTS.md`, the canonical harness, and its Pi projections are versioned.
Keep memory, preferences, session state, browser evidence, and the separately
installed builder package local; never force-add private state.

## Theme Reports
A past report of the light theme rendering dark after F5 was caused by the
user's Dark Reader extension, not the app. For new theme reports, check browser
extensions and forced dark modes before changing theme code.

## Git and Local Data
- Use focused Conventional Commits; include relevant tests and documentation.
- Never commit secrets, browser profiles/captures, memory, generated exports, or dependencies.
- Keep `.engram/`, `.ldout/`, `.playwright-cli/`, `export/`, `dist/`, and `node_modules/` local.
- Do not change the existing deployment base or storage format without explicit scope and verification.
Read and follow REPO-HARNESS.md before working in this repository.
