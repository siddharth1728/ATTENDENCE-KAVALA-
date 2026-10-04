<div align="center">
  <img src="public/icon-512.png" alt="ATTEND app icon" width="112" height="112" />
  <h1>ATTEND</h1>
  <p><strong>Know where you stand. Plan what happens next.</strong></p>
  <p>A focused, mobile-first attendance companion for tracking your 75% target.</p>
</div>

<p align="center">
  <a href="#getting-started">Get started</a> ·
  <a href="#what-it-does">Features</a> ·
  <a href="#privacy">Privacy</a> ·
  <a href="#mobile-apps">Mobile apps</a>
</p>

---

## At a glance

ATTEND turns the attendance totals you enter into a clear picture of your current percentage, distance from a 75% target, and the effect of future classes. Regular attendance and ECE/ECA are calculated separately.

- **Release:** 1.0.0
- **Web:** React, TypeScript, and Vite
- **Mobile:** Capacitor for Android and iOS
- **Storage:** On-device browser storage; no attendance backend
- **Application ID:** `app.attend.companion`

## What it does

### See your current status

The main view shows attended and held class totals, your attendance percentage, your 75% status, and—when you are at or above the target—how many additional classes you can miss while staying at or above it.

### Explore future scenarios

Compare attending or missing the next 1, 3, 5, or 10 classes. The custom calculator lets you set upcoming, attended, and missed class counts and immediately see the projected totals and percentage.

### Keep ECE/ECA separate

Regular classes and ECE/ECA have independent totals and calculations. One category is never added to the other.

### Update and save your totals

Enter aggregate totals for classes held and attended. ATTEND validates the values, updates the calculations, and saves them on the current device. You can reset to the included demo baseline at any time.

## Getting started

### Requirements

- Node.js compatible with the installed Vite 8 toolchain
- npm

### Install and run

```sh
git clone https://github.com/siddharth1728/ATTENDENCE-KAVALA-.git
cd ATTENDENCE-KAVALA-
npm ci
npm run dev
```

Open the local URL printed by Vite.

### Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm test` | Run the Vitest unit and UI tests |
| `npm run lint` | Run Oxlint |
| `npm run build` | Type-check and create the production bundle in `dist/` |
| `npm run preview` | Serve the production bundle locally |

To validate a production build locally:

```sh
npm run build
npm run preview
```

## Install as a web app

ATTEND includes a web app manifest, install icons, and a service worker. Deploy the production build over HTTPS, open it in a supported browser, and use that browser’s **Install app** or **Add to Home Screen** option. The manifest requests standalone display.

The service worker caches the app shell and static assets for repeat visits. Attendance values are stored by the browser for the current site origin; they are not synchronized between browsers or devices.

## Mobile apps

Capacitor configuration uses the app name `ATTEND`, application ID `app.attend.companion`, and the Vite output directory `dist`.

### Android

Install the project dependencies, build the web app, then synchronize its assets into the Android project:

```sh
npm ci
npm run build
npx cap sync android
```

Open `android/` in Android Studio to configure an emulator or device and build a debug app. An Android build requires a compatible JDK, Android SDK, and Android Studio/Gradle setup.

### iOS

On macOS with Xcode installed:

```sh
npm ci
npm run build
npx cap sync ios
npx cap open ios
```

Select a simulator or device and build from Xcode. iOS native builds require macOS and Xcode.

## How the calculation works

Attendance is based on aggregate class counts:

```text
attendance percentage = attended classes / classes held × 100
```

At 75% or above the status is **SAFE**. The safe-absence buffer is the greatest whole number of additional absences that keeps the percentage at or above 75%. If attendance is below the target, ATTEND calculates the consecutive attended classes needed to reach it.

For the included demo baseline:

| Category | Attended / held | Current | Safe absences |
| --- | ---: | ---: | ---: |
| Regular | 208 / 244 | 85.25% | 33 |
| ECE/ECA | 10 / 10 | 100.00% | 3 |

These are example values, not live institutional records. Use **Update Attendance** to enter your own totals.

## Privacy

- Attendance totals are saved locally in the browser’s `localStorage` for the current origin.
- There is no account, attendance API, or cloud synchronization.
- Clearing browser/site data can remove saved attendance. Use the same browser and origin to see the same saved values.
- The page loads the Inter font from Google Fonts, which makes a request to Google’s font service.
- Vercel Web Analytics is included for deployed, non-localhost hosts. It is skipped on `localhost` and `127.0.0.1`. When enabled on a Vercel deployment, it can collect page-view analytics; attendance totals are not passed to it by the app.

## Project layout

```text
src/
  components/   Attendance cards, scenario controls, and update sheet
  data/         Demo baseline values
  utils/        Local attendance storage
  App.tsx       App composition and state
  engine.ts     Pure attendance and scenario calculations
  *.test.ts*    Calculation and UI tests
public/
  manifest.webmanifest
  sw.js
  icon-*.png
android/        Capacitor Android project
ios/            Capacitor iOS project
```

## Development notes

- Keep attendance calculations in the pure functions in `src/engine.ts`.
- Keep Regular and ECE/ECA state independent.
- Run `npm test`, `npm run lint`, and `npm run build` before proposing a change.
- Do not put real student attendance information, credentials, or other sensitive data in source code or issues.
