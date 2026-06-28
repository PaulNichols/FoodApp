# Food Log

A private mobile-first daily food tracker built with React, Vite, and TypeScript for GitHub Pages.

The default day is optimised for a routine of morning supplements, Man Shake + WPI breakfast, Paul's lunch shake, Man Shake + WPI evening meal, optional snacks, and daily notes.

## Privacy Warning

Food photos, diet notes, supplement notes, training hunger notes, and health-related observations are personal data. Treat exported zip files and committed `/data` and `/photos` files as sensitive.

This app does not include analytics, CDN scripts, or a backend. It does not bundle a GitHub token and does not contain any hardcoded token.

## Run Locally

```bash
npm install
npm run dev
```

Vite prints the local URL, usually `http://localhost:5173/`.

## Build Locally

```bash
npm run build
```

The static site is generated in `dist/`. The build output should not include repository `/data` or `/photos` folders for v1.

## Deploy to GitHub Pages

This repository includes `.github/workflows/deploy.yml`.

1. In GitHub, open repository **Settings**.
2. Go to **Pages**.
3. Set **Build and deployment** source to **GitHub Actions**.
4. Push to `main` or run the workflow manually.

The workflow runs `npm ci`, `npm run build`, uploads `dist`, and deploys using the official GitHub Pages actions.

## Vite Base Path

`vite.config.ts` infers the repository name from `GITHUB_REPOSITORY` during GitHub Actions builds. For local builds it falls back to `/FoodApp/`, matching the current repository URL shape:

```text
https://OWNER.github.io/FoodApp/
```

If this app is moved to a different repository, update the local fallback and manifest paths as needed.

## Storage Modes

### Local Only

Local-only mode is the default. It stores daily JSON and compressed photos in IndexedDB on the current device. It works offline after the app has loaded, but clearing browser website data can remove local logs and photos.

Use manual exports only as a backup. The normal workflow is to save into GitHub repo mode so the repository contains the daily JSON and photos for later Codex analysis.

### GitHub Repo

GitHub repo mode uses the GitHub REST API from the browser only when you manually enter your own fine-grained personal access token in Settings.

Token rules:

- No token is hardcoded in the app, workflow, source, README examples, or environment files.
- The token is optional.
- The token is stored in `sessionStorage` by default, not `localStorage`.
- The token is never logged.
- Use **Forget token** to remove it from the browser session.

Create a fine-grained GitHub token scoped to this single repository only with minimum **Contents: Read and write** permission. Do not grant broad account or organization permissions.

When saving in GitHub mode, the app saves locally first, then commits:

- `data/yyyy/mm/yyyy-mm-dd.json`
- `photos/yyyy/mm/yyyy-mm-dd/*.webp`

Existing files are updated by fetching the current file SHA first.
Each save also removes repository `/data` and `/photos` files with path dates more than one month older than the current Brisbane date.

Another Codex session can analyse the saved repository files directly from `/data` and `/photos`; you should not need to export zip files for routine weekly analysis.

## Exporting

The Today page includes manual backup exports:

- **Export day zip**
- **Export week zip**

Zip structure:

```text
data/yyyy/mm/yyyy-mm-dd.json
photos/yyyy/mm/yyyy-mm-dd/*.webp
```

Exports work without GitHub storage because they read from the browser's local IndexedDB data.

## Daily JSON

One JSON file is stored per day:

```text
data/yyyy/mm/yyyy-mm-dd.json
```

The JSON includes supplements, default meals, replacement meal notes/photos, snacks, daily notes, and Brisbane timestamps.

## Weekly Codex Analysis

A later Codex job can read repository files directly from:

- `/data`
- `/photos`

Useful weekly analysis targets:

- default meal consistency
- supplement consistency
- creatine consistency
- AgeMate consistency
- collagen peptides consistency
- evening meal replacements
- snack frequency
- photos of replacement meals
- whether under-eating after swimming or training appears likely
- whether dinners or snacks are the main issue
- simple improvements for the next week
