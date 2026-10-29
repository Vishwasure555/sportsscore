# SportsScore

Live scores, fixtures and results for cricket and Formula 1, with your favourite teams pinned at the top and "Watch on" links to official broadcasters and YouTube.

- **App:** https://vishwasure555.github.io/sportsscore/
- **Android APK:** latest file under [Releases](../../releases)

## How updates reach the phone

The Android app is a Trusted Web Activity: a thin wrapper that opens the hosted web app.

| You change… | What happens | Reinstall APK? |
|---|---|---|
| App code (`src/…`) | Push to `main` → **Deploy web app** workflow publishes it in ~1 min | No — reopen the app |
| App name, icon, package (`android/twa-manifest.json`) | Run **Build Android APK** workflow (Actions tab → Run workflow) | Yes, install the new release |

## Data sources

| Sport | Source | Key |
|---|---|---|
| Cricket | [CricketData.org](https://cricketdata.org/) `cricScore` endpoint (free: 100 hits/day) | Entered in the app's Settings, stored on the phone only |
| F1 | [Jolpica F1 API](https://github.com/jolpica/jolpica-f1) | None |

The cricket refresh rate is adjustable in Settings. One refresh = one API hit.

## Watch links

All broadcaster and YouTube links live in `src/config/links.js`. Edit that file when broadcast rights change.

## Debugging on the phone

Open the app once with `?debug` on the URL (e.g. `https://vishwasure555.github.io/sportsscore/?debug`) for an on-screen console. Turn it off with `?debug=off`.

## One-time setup

1. **Settings → Pages → Source: GitHub Actions**
2. **Settings → Secrets and variables → Actions → New repository secret:** `KEYSTORE_PASSWORD` (the password for `android/upload.keystore`)
3. Optional, removes the browser bar at the top of the Android app: create the repo `Vishwasure555.github.io` with `.well-known/assetlinks.json` (see `android/assetlinks.json`) and a `_config.yml` containing `include: [".well-known"]`.

## Local development

```bash
npm install
npm run dev
```
