# CLAUDE.md — AI Assistant Guide for Claude-UP

This file provides context for AI assistants (Claude, Copilot, etc.) working in this repository.

---

## Project Overview

**Claude-UP** is a personal learning project that records experiments with Claude Code. The primary artifact is **`ielts-app`** — a fully client-side IELTS English learning web application built with React + Vite, deployed to GitHub Pages.

The app has three core modules:
1. **Article Reading** — import articles (URL/text/file), read with TTS, collect unknown words
2. **Vocabulary Learning** — flashcard-style learning across three difficulty levels (basic / intermediate / advanced)
3. **Daily Practice** — auto-generated quizzes that prioritize previously wrong answers

There is **no backend**. All data is persisted in the browser's `localStorage`.

---

## Repository Layout

```
Claude-UP/
├── ielts-app/                  # Main application (all dev work happens here)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js          # base: '/Claude-UP/' for GitHub Pages
│   ├── eslint.config.js        # ESLint flat config (v9)
│   └── src/
│       ├── main.jsx            # React entry point
│       ├── App.jsx             # Router setup (React Router v7)
│       ├── App.css / index.css
│       ├── components/
│       │   ├── Layout.jsx      # Shell: header + desktop nav + mobile bottom tabs
│       │   └── ArticleReader.jsx  # Article reading UI with TTS, translation, word collection
│       ├── pages/
│       │   ├── Dashboard.jsx   # Stats: streak, accuracy, daily progress, quick actions
│       │   ├── Articles.jsx    # Article list + import (URL / paste / file)
│       │   ├── Vocabulary.jsx  # Flashcard UI with level filter and mastery tracking
│       │   └── Practice.jsx    # Quiz engine (multiple-choice, reverse, spelling)
│       ├── utils/
│       │   ├── storage.js      # All localStorage read/write (single source of truth)
│       │   ├── practice.js     # Quiz generation: prioritizes wrong answers, rotates types
│       │   ├── translate.js    # MyMemory API + localStorage cache + offline fallback
│       │   ├── tts.js          # Web Speech API wrapper (rate control, callbacks)
│       │   └── fetchUrl.js     # CORS-proxy URL fetcher + HTML content extractor
│       └── data/
│           └── vocabulary.js   # Static IELTS word list (basic/intermediate/advanced)
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions: build → GitHub Pages on push to main
├── IELTS-Learning-PRD.md       # Original product requirements document
└── README.md                   # Minimal root readme
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 |
| Router | React Router DOM 7 |
| Build tool | Vite 7 |
| CSS | Tailwind CSS 4 (Vite plugin — no config file needed) |
| Linter | ESLint 9 (flat config) |
| Deployment | GitHub Pages via GitHub Actions |
| Runtime APIs | Web Speech API, Fetch API, localStorage |
| External APIs | MyMemory Translation, allorigins.win / corsproxy.io (CORS proxies) |

---

## Development Commands

All commands must be run from `ielts-app/`:

```bash
cd ielts-app

npm install        # install dependencies (first time)
npm run dev        # start dev server at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview production build locally
npm run lint       # ESLint check
```

> The dev server does **not** use the `/Claude-UP/` base path, so local links resolve correctly without it.

---

## Key Conventions

### State & Persistence

- **All data lives in `localStorage`** via `src/utils/storage.js`.
- Never access `localStorage` directly from components or other utilities — always go through `storage.js`.
- Storage keys are defined as named exports at the top of `storage.js`. Add new keys there.

### Styling

- Use **Tailwind utility classes** exclusively. There is no CSS modules setup.
- `App.css` and `index.css` contain only global resets and Tailwind directives.
- Tailwind v4 is integrated via the Vite plugin (`@tailwindcss/vite`). There is no `tailwind.config.js`.
- Responsive design follows a **mobile-first** pattern. Desktop adjustments use `md:` / `lg:` prefixes.
- Navigation: desktop shows a top nav bar; mobile shows a bottom tab bar (both in `Layout.jsx`).

### Component Patterns

- Pages are in `src/pages/`, shared UI in `src/components/`.
- Keep page components focused on layout and coordination; push business logic to `utils/`.
- `ArticleReader.jsx` is rendered as a child of `Articles.jsx` (not a separate route).

### Routing

Routes are defined in `App.jsx` using React Router v7's `<Routes>` / `<Route>`:

| Path | Component |
|---|---|
| `/Claude-UP/` | Dashboard |
| `/Claude-UP/articles` | Articles |
| `/Claude-UP/vocabulary` | Vocabulary |
| `/Claude-UP/practice` | Practice |

When adding new pages, register the route in `App.jsx` and add a nav item to `Layout.jsx`.

### Translation & TTS

- `translate.js` calls the **MyMemory free API** (no auth key) and caches results in localStorage to avoid repeated requests.
- `tts.js` wraps `window.speechSynthesis`. Always check for browser support before calling.

### URL Import

- `fetchUrl.js` uses CORS proxy services (`allorigins.win`, `corsproxy.io`) to fetch external URLs.
- It strips navigation, footers, and ads using a priority list of semantic selectors (`article`, `main`, `.content`, etc.).
- CORS proxy availability varies; the utility tries multiple proxies in sequence.

### Vocabulary Data

- `src/data/vocabulary.js` is the **static word database**. It is not fetched from an API.
- Each word: `{ id, word, phonetic, partOfSpeech, meaning, level, exampleEn, exampleZh }`
- To add words, edit this file directly.

---

## Build & Deployment

- **Branch:** development happens on feature branches prefixed with `claude/`; merges go to `main` (or `master`).
- **CI/CD:** `.github/workflows/deploy.yml` auto-triggers on push to `main`.
  - Runs `npm ci && npm run build` inside `ielts-app/`
  - Uploads `ielts-app/dist/` as a GitHub Pages artifact
- **Base path:** Vite is configured with `base: '/Claude-UP/'` so all asset paths are prefixed correctly for GitHub Pages.
- **No tests in CI** currently. Lint is not enforced by CI — run it manually before committing.

---

## What Does Not Exist (yet)

- Unit tests / integration tests (no test runner configured)
- Backend / API server
- Authentication
- Database (everything is localStorage)
- Tailwind config file (v4 doesn't need one for basic usage)
- TypeScript (plain JS/JSX)

Do not add these unless explicitly requested.

---

## Gotchas

1. **Base path in production vs dev.** In dev, React Router `<Link>` paths should not include `/Claude-UP/` — Vite handles the base automatically. In production, links must match the configured base.
2. **localStorage size limit.** Articles and cached translations are stored in localStorage; very large articles may approach browser limits (~5 MB).
3. **CORS proxy reliability.** External URL import depends on free proxy services that may be rate-limited or unavailable. This is a known limitation of the client-only architecture.
4. **ESLint flat config.** `eslint.config.js` uses the v9 flat format — do not use `.eslintrc.*` files.
5. **Tailwind v4 syntax.** The `@apply` directive and theme extensions work differently in v4. Consult the Tailwind v4 docs if adding custom styles.
