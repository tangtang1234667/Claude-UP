# CLAUDE.md

## Project Overview

IELTS Learning Website (雅思学习助手) — a pure frontend React application for IELTS exam preparation. It provides article reading with TTS, vocabulary flashcards, and AI-generated practice quizzes. All data is persisted in browser localStorage; there is no backend.

## Repository Structure

```
Claude-UP/
├── .github/workflows/deploy.yml   # GitHub Pages CI/CD
├── IELTS-Learning-PRD.md          # Product requirements document
├── README.md
├── CLAUDE.md                      # This file
└── ielts-app/                     # Application root (all npm commands run here)
    ├── package.json
    ├── vite.config.js
    ├── eslint.config.js
    ├── index.html
    ├── public/
    └── src/
        ├── main.jsx               # Entry point (React 19, StrictMode)
        ├── App.jsx                # HashRouter with 4 routes
        ├── index.css              # Tailwind import + custom animations
        ├── App.css                # Empty (all styling via Tailwind)
        ├── components/
        │   ├── Layout.jsx         # Shell: header, nav, <Outlet />
        │   └── ArticleReader.jsx  # Article display with TTS + translation
        ├── pages/
        │   ├── Dashboard.jsx      # Stats overview + quick actions
        │   ├── Articles.jsx       # Article import/list/read
        │   ├── Vocabulary.jsx     # Flashcard learning by level
        │   └── Practice.jsx       # Quizzes, wrong-answer review, history
        ├── data/
        │   └── vocabulary.js      # Static IELTS word list (~200+ entries)
        └── utils/
            ├── storage.js         # localStorage wrapper (ielts_* keys)
            ├── tts.js             # Web Speech API TTS wrapper
            ├── translate.js       # MyMemory translation API + cache
            ├── practice.js        # Quiz question generation logic
            └── fetchUrl.js        # URL content extraction via CORS proxy
```

## Tech Stack

- **Runtime:** Browser (no Node.js backend)
- **Framework:** React 19 with functional components and hooks
- **Build tool:** Vite 7
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite` plugin) + custom CSS animations in `index.css`
- **Routing:** React Router DOM 7 using `HashRouter` (required for GitHub Pages)
- **Language:** JavaScript/JSX (no TypeScript, despite `@types/*` dev deps)
- **State:** React `useState`/`useEffect` — no external state management library
- **Persistence:** `localStorage` via `src/utils/storage.js` (all keys prefixed `ielts_`)
- **External APIs:** MyMemory Translation API (free, no auth), CORS proxies (allorigins.win, corsproxy.io)
- **Browser APIs:** Web Speech API (TTS), Fetch, FileReader, DOMParser

## Development Commands

All commands must be run from the `ielts-app/` directory:

```sh
cd ielts-app
npm install        # Install dependencies
npm run dev        # Start Vite dev server with HMR
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint (flat config, JS/JSX files)
```

There are no test scripts or test framework configured.

## Build & Deploy

- **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`) deploys to GitHub Pages on push to `main`
- **Base path:** Vite is configured with `base: '/Claude-UP/'` for GitHub Pages
- **Build output:** `ielts-app/dist/`
- **Node version in CI:** 20

## Code Conventions

### General

- Pure JavaScript with JSX — do not introduce TypeScript
- Functional components only; use hooks (`useState`, `useEffect`, `useCallback`, `useRef`)
- PascalCase for component files and names, camelCase for utilities and variables
- ES modules throughout (`"type": "module"` in package.json)

### Styling

- Use Tailwind CSS utility classes as the primary styling approach
- Custom animations are defined in `src/index.css` with corresponding utility classes (`animate-fade-in-up`, `animate-shake`, `glass-card`, `tilt-card`, etc.)
- Staggered animation delays use classes `stagger-1` through `stagger-6`
- Do not use CSS-in-JS libraries or CSS preprocessors

### Data & State

- All persistent data goes through `src/utils/storage.js` — never call `localStorage` directly from components
- Storage keys are prefixed with `ielts_` (defined as constants in `storage.js`)
- Data domains: articles, favorites, learning progress, wrong answers, practice history, streak, today's learned words
- Vocabulary data is a static JS array in `src/data/vocabulary.js` with shape: `{ id, word, phonetic, pos, meaning, level, examples }`

### Routing

- Uses `HashRouter` (not `BrowserRouter`) — this is required for GitHub Pages compatibility
- Routes: `/` (Dashboard), `/articles`, `/vocabulary`, `/practice`
- Layout wraps all routes via an `<Outlet />`

### ESLint Rules

- ESLint 9 flat config format (`eslint.config.js`)
- Extends: `@eslint/js` recommended, `react-hooks` recommended, `react-refresh` for Vite
- `no-unused-vars` allows variables starting with uppercase letters or underscore (`^[A-Z_]`)
- Target: ES2020+, browser globals

## Architecture Notes

- **No backend.** The app runs entirely in the browser. Do not add server-side code or API routes.
- **CORS proxies** are used in `fetchUrl.js` for cross-origin article fetching. The proxies (`allorigins.win`, `corsproxy.io`) may be unreliable; the code falls back between them.
- **Translation** uses the free MyMemory API with a local in-memory cache to avoid redundant requests.
- **TTS** uses the browser's built-in `SpeechSynthesis` API — no external TTS service.
- **Quiz generation** in `practice.js` prioritizes previously wrong answers (50% of questions) and shuffles options randomly.

## Key Patterns When Making Changes

1. **Adding a new page:** Create a component in `src/pages/`, add a `<Route>` in `App.jsx`, and add a nav link in `Layout.jsx`.
2. **Adding new persistent data:** Add a new key to the `KEYS` object in `storage.js` and create corresponding getter/setter functions.
3. **Adding vocabulary words:** Append entries to the array in `src/data/vocabulary.js` following the existing shape.
4. **Adding animations:** Define `@keyframes` in `index.css`, then add a utility class with the animation applied.
5. **Running before commit:** Run `npm run lint` and `npm run build` from `ielts-app/` to verify no errors.
