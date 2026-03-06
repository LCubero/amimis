# Repository Guidelines

## Project Structure & Module Organization
This repository is a small static web app (no build step required).
- `index.html`: app shell, form markup, accessibility attributes, and module entrypoint.
- `src/app.js`: UI wiring, DOM events, localStorage persistence, theme toggling, and URL sync.
- `src/time.js`: pure time/duration utilities (`parseDuration`, `computeBedtime`, `formatTime`).
- `src/styles.css`: theme tokens and component styling.
- `.agents/`: local agent skills and references; do not couple runtime app logic to this directory.

## Build, Test, and Development Commands
There is no package manager or bundler configured in this workspace.
- `python3 -m http.server 4173`: run the app locally at `http://localhost:4173`.
- `npx serve .`: alternative static server if Node is available.
- `open http://localhost:4173` (macOS) or `xdg-open http://localhost:4173` (Linux): open in browser.

## Coding Style & Naming Conventions
- Use 2-space indentation in HTML/CSS/JS to match existing files.
- Prefer ES modules and named exports for reusable logic (`src/time.js`).
- Use `camelCase` for variables/functions, `UPPER_SNAKE_CASE` for constants, and kebab-case IDs/classes in HTML/CSS.
- Keep logic in `src/time.js` pure and side-effect free; keep DOM/state concerns in `src/app.js`.
- Preserve accessibility patterns (`aria-*`, semantic form controls, visible focus styles).

## Testing Guidelines
No automated test runner is configured yet.
- Validate changes manually in a browser before opening a PR.
- Verify: duration parsing edge cases, invalid input states, 12h/24h formatting, theme toggle persistence, and mobile layout.
- If adding tests, place them under `tests/` and prefer utility-level tests for `src/time.js` first.

## Commit & Pull Request Guidelines
Git history is not available in this checkout, so follow a lightweight Conventional Commit style.
- Commit format: `type(scope): summary` (e.g., `feat(time): support "7 horas y media" parsing`).
- Keep commits focused and small; separate refactors from behavior changes.
- PRs should include: clear description, before/after behavior, manual test steps, and screenshots/GIFs for UI changes.
- Link related issues/tasks when applicable.

## Security & Configuration Tips
- Do not commit secrets or environment-specific data.
- Keep storage keys versioned (e.g., `*-v1`) when changing persisted shape.
