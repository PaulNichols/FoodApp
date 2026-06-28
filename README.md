# Food Log

A private mobile-first daily food tracker built with React, Vite, and TypeScript for GitHub Pages.

The default day is optimised for a routine of morning supplements, Man Shake + WPI breakfast, Paul's lunch shake, Man Shake + WPI evening meal, optional snacks, and daily notes.

## Privacy Warning

Food photos, diet notes, supplement notes, training hunger notes, and health-related observations are personal data. Treat committed `/data` and `/photos` files as sensitive.

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

Saving uses the GitHub REST API from the browser. On the first save in a browser session, the app asks for your fine-grained personal access token, stores it in `sessionStorage`, and then writes to `PaulNichols/FoodApp` on `main`.

Token rules:

- No token is hardcoded in the app, workflow, source, README examples, or environment files.
- The token is stored in `sessionStorage`, not `localStorage`.
- The token is never logged.
- Close the browser tab/session to forget the token.

Create a fine-grained GitHub token scoped to this single repository only with minimum **Contents: Read and write** permission. Do not grant broad account or organization permissions.

When saving, the app commits:

- `data/yyyy/mm/yyyy-mm-dd.json`
- `photos/yyyy/mm/yyyy-mm-dd/*.webp`

Existing files are updated by fetching the current file SHA first.
Each save also removes repository `/data` and `/photos` files with path dates more than one month older than the current Brisbane date.

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

If you edit the analysis fields in the app, the entry is marked as `source: "manual"` so the scheduled analyser will not overwrite it.

## Scheduled Food Analysis

This repository includes `.github/workflows/analyse-food.yml`.

The workflow runs each day at `10:30 UTC`, which is `8:30 PM Australia/Brisbane`, and can also be run manually from the GitHub Actions tab.

To enable it:

1. In GitHub, open repository **Settings**.
2. Go to **Secrets and variables**.
3. Add an Actions secret named `OPENAI_API_KEY`.
4. Optionally add an Actions variable named `OPENAI_FOOD_ANALYSIS_MODEL`; otherwise the workflow uses `gpt-4.1-mini`.

The workflow scans recent `/data` JSON files and matching `/photos` files, estimates the meal or snack name and calories, then commits the updated JSON back into `/data`.

Privacy note: when this workflow runs, food photos and related notes are sent to OpenAI for analysis. Keep the repository and workflow secrets private.

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
