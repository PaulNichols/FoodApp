# Food Log

A mobile-first daily food tracker built with React, Vite, and TypeScript for GitHub Pages.

The default day is optimised for a routine of morning supplements, Man Shake + WPI breakfast, Paul's lunch shake, Man Shake + WPI evening meal, optional snacks, and daily notes.

## Public Data

This repository is intentionally public for the personal fitness workflow, so committed `/data` and `/photos` files are public too.

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

## GitHub Saving

The app is fixed to save into this repository so another Codex session can read daily JSON and photos at any time.

Saving uses the GitHub REST API from the browser. On the first save on a device, the app asks for your fine-grained personal access token, stores it in that browser's local storage, and then writes to `PaulNichols/FoodApp` on `main`.

Token rules:

- No token is hardcoded in the app, workflow, source, README examples, or environment files.
- The token is stored only in the browser on that device, not in the repository.
- The token is never logged.
- Use **Forget token** in the app if you want that browser to remove the saved token.

Create a fine-grained GitHub token scoped to this single repository only with minimum **Contents: Read and write** permission. Do not grant broad account or organization permissions.

When saving, the app commits:

- `data/yyyy/mm/yyyy-mm-dd.json`
- `photos/yyyy/mm/yyyy-mm-dd/*.webp`

Existing files are updated by fetching the current file SHA first.
When a session token is available, opening a date loads the saved GitHub JSON back into the form so you can edit and save that day again.
Each save also removes repository `/data` and `/photos` files with path dates more than one month older than the current Brisbane date.
The scheduled analysis workflow applies the same one-month retention, so old dated JSON and photo files are cleaned even if you do not save from the phone that day.

Another Codex session can analyse the saved repository files directly from `/data` and `/photos`; there is no manual export step in the app.

## Daily JSON

One JSON file is stored per day:

```text
data/yyyy/mm/yyyy-mm-dd.json
```

The JSON includes supplements, default meals, replacement meal notes/photos, snacks, daily notes, and Brisbane timestamps.

Meal and snack entries may also include editable analysis fields:

- `analysis.itemName`
- `analysis.calories`
- `analysis.confidence`
- `analysis.source`
- `analysis.notes`

If you edit the analysis fields in the app, the entry is marked as `source: "manual"` so the scheduled analyser will not overwrite it. Automated estimates may use `source: "codex"` or `source: "openai"` depending on which analyser created them.

## Codex Food Summary

The automation-readable summary is generated at:

```text
data/codex-food-summary.json
```

It contains the latest 31-day window by default, including logged/missing days, supplement completion, default meal adherence, replaced meals, snack count, photo count, estimated calories when available, and per-day meal/snack analysis metadata.

The summary deliberately avoids copying raw daily notes or supplement notes. Those remain in the dated JSON files when deeper manual review is needed.

Run it locally with:

```bash
npm run summarise:food
```

Optional environment variables:

- `FOOD_SUMMARY_DAYS` controls the window length.
- `FOOD_SUMMARY_END_DATE` sets the end date as `yyyy-mm-dd` for repeatable checks.

## Food Data Retention

FoodApp keeps one Brisbane calendar month of dated repository data.

Retention removes old files that match:

- `data/yyyy/mm/yyyy-mm-dd.json`
- `photos/yyyy/mm/yyyy-mm-dd/*`

It does not remove `data/codex-food-summary.json`.

Run the same cleanup locally with:

```bash
npm run cleanup:food
```

Optional environment variable:

- `FOOD_RETENTION_END_DATE` sets the end date as `yyyy-mm-dd` for repeatable checks.

## Scheduled Food Analysis

The active scheduled analyser is the Codex automation:

```text
FoodApp Daily Food Analysis
```

It runs daily at 8:35 PM Australia/Brisbane, reads recent `/data` JSON files and matching `/photos` files, estimates meal/snack names and calories, runs retention cleanup, rebuilds `data/codex-food-summary.json`, and commits updated data back to the repository.

The older GitHub Actions workflow `.github/workflows/analyse-food.yml` is currently disabled manually because its OpenAI API key run failed with quota. Do not re-enable it unless you want GitHub Actions to take over this job again.

To re-enable the GitHub Actions workflow later:

1. In GitHub, open repository **Settings**.
2. Go to **Secrets and variables**.
3. Add an Actions secret named `OPENAI_API_KEY`.
4. Optionally add an Actions variable named `OPENAI_FOOD_ANALYSIS_MODEL`; otherwise the workflow uses `gpt-4.1-mini`.

The workflow scans recent `/data` JSON files and matching `/photos` files, estimates the meal or snack name and calories, removes dated JSON/photos older than one month, rebuilds `data/codex-food-summary.json`, then commits the updated files back into the repository.

Analysis note: when this workflow runs, food photos and related notes are sent to OpenAI for analysis. Keep workflow secrets private.

## Weekly Codex Analysis

A later Codex job can read repository files directly from:

- `/data/codex-food-summary.json`
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
