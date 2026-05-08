# Swim Gym Tracker

A super simple mobile-first gym tracker for Program A and Program B. It is a static React + Vite + TypeScript app designed to run for free on GitHub Pages with all version 1 data stored in browser `localStorage`.

## Tech Stack

- React
- Vite
- TypeScript
- Plain CSS
- Browser `localStorage`
- GitHub Pages and GitHub Actions

No backend API, database, server-side hosting, or paid service is required.

## Run Locally

```bash
npm install
npm run dev
```

Vite will print the local URL, usually `http://localhost:5173/`.

## Build

```bash
npm run build
```

The static site is generated in `dist/`.

## Deploy to GitHub Pages

This repository includes `.github/workflows/deploy-pages.yml`.

1. Push the app to the `main` branch.
2. In GitHub, open the repository settings.
3. Go to **Pages**.
4. Set **Build and deployment** to **GitHub Actions**.
5. Push to `main` or run the workflow manually.

The workflow installs dependencies, runs `npm run build`, uploads `dist`, and deploys it to GitHub Pages.

## Vite Base Path

The current repository is `GymApp`, so `vite.config.ts` uses:

```ts
base: '/GymApp/'
```

If the repository name changes, update this value to match the new GitHub Pages path:

```ts
base: '/NEW_REPOSITORY_NAME/'
```

Also update these files if the repo path changes:

- `public/manifest.webmanifest`
- `public/sw.js`

For a custom domain at the web root, use:

```ts
base: '/'
```

## How Data Works

All data is stored in the browser on the device using `localStorage`.

The app stores:

- Program definitions
- Exercise definitions
- Workout history
- Most recent value per exercise

The storage code lives in `src/services/storageService.ts` so localStorage access is not scattered through the app.

Important limitation: clearing Safari website data, switching phones, or using a different browser can remove or hide this local data. Use export/import for backups.

## Use the App

1. Open the app on your phone.
2. Choose **Program A** or **Program B**.
3. Work through one exercise at a time.
4. Check the visual cue card or tap **Watch form videos** for YouTube form search results.
5. Enter today’s value and optional notes.
6. Tap **Save and Next**.
7. Tap **Finish Program** on the final exercise.

Each exercise shows the most recent saved value, for example `Last time: 35 kg`. If there is no history, it shows `No previous entry`.

## Edit Programs

Open **Admin / Edit Programs** to:

- View Program A or Program B
- Add exercises
- Edit exercise name, equipment, unit, category, and image URL
- Edit YouTube URL and visual cue text
- Delete exercises
- Move exercises up or down
- Reset back to the default programs

Program edits are stored in `localStorage`.

## Export Data

Open **Export / Import Data** and tap **Export Data**.

The app downloads a JSON file containing:

- App version
- Export date/time
- Program definitions
- Workout history

Keep this file somewhere safe if your phone browser data matters.

## Import Data

Open **Export / Import Data**, tap **Import Data**, and choose a previous JSON export.

The app validates the basic shape of the file and asks for confirmation before replacing your current programs and history.

## Default Programs

Program A is Pull, legs, core.

Program B is Swim power, back, hips, shoulders.

The included default exercises match the first version requirements and use sensible default units such as `kg` and `seconds`.

Each default exercise also includes three short form cues and a YouTube search link. The app does not bundle copyrighted exercise photos or videos.

## PWA Support

The app includes a web app manifest, placeholder icon, theme colour, and a small service worker for basic offline caching after the production site has loaded once.

On iPhone, open the deployed GitHub Pages site in Safari and use **Add to Home Screen**.

## Future Improvements

- Cloud sync
- User login
- Charts
- Personal bests
- Exercise images
- Rest timer
- Apple Health integration
- Multiple users
- Supabase backend option
- Firebase backend option
- Azure Static Web Apps option
- Azure Functions and Table Storage backend option for later cloud storage
- Ability to track reps and sets properly
- Ability to record perceived effort
- Ability to record bodyweight
- Ability to export CSV
