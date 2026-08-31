# AkuafoDwa — shareable Android APK

This is a small Android Studio project that wraps the **live AkuafoDwa web app** in a
full-screen Android shell:

- AkuafoDwa icon + name on the phone's home screen, **no address bar**
- **Branded splash screen** (logo + name + spinner) while the market loads, fades out when ready
- Listing photos / ID document uploads work (system file picker)
- WhatsApp share links, `tel:`, `mailto:` open in the phone's own apps
- Pull-to-refresh, offline screen with retry
- Everything runs against your real market — all data is saved in your Neon database

> It loads `https://akuafodwa.vercel.app`. If your URL is different, change **both**
> `app_url` and `app_host` in `app/src/main/res/values/strings.xml` — that's the only
> place to edit.

---

## Route 1 — Build the APK in Android Studio (recommended)

1. **Install Android Studio**: https://developer.android.com/studio
   (~1 GB install; first project sync downloads the SDK pieces it needs — you just click through.)
2. **Get this folder on that PC**: `git pull` the repo, or on GitHub press
   **Code → Download ZIP**, unzip, and find `android-app` inside.
3. Open Android Studio → **Open** → select the `android-app` folder → **Trust Project**.
4. Wait for the Gradle sync to finish (progress bar bottom-right; first time is the slow one).
   - If Studio offers to upgrade the Android Gradle Plugin or install a newer SDK — click **OK/Update**.
5. Menu: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
6. When it finishes, click **locate** in the popup. The file is at:
   `android-app/app/build/outputs/apk/debug/app-debug.apk`
7. **Share that file** on WhatsApp / Telegram / email. Recipients:
   download → tap it → allow "Install unknown apps" when Android asks → install → open.

No signing needed for this — a debug APK installs fine on any phone.

## Route 2 — No Android Studio at all (fastest, 10 minutes)

The site is already a store-grade PWA, so pwabuilder.com can package it for you:

1. Go to **https://www.pwabuilder.com**, paste your Vercel URL, click **Start**.
2. When it finishes analysing, pick **Package for stores → Android**.
3. Options: package id `com.akuafodwa.app`, app name `AkuafoDwa` → **Download** the zip.
4. Inside the zip, `app-release-signed.apk` is ready to share (keep `signing.keystore` safe if
   you ever go to the Play Store).
5. Optional (removes the small URL bar a TWA shows): add two env vars in Vercel —
   `TWA_PACKAGE_NAME=com.akuafodwa.app` and `TWA_SHA256_FINGERPRINTS=<SHA-256 from the zip's
   assetlinks/readme>` — the `/.well-known/assetlinks.json` endpoint picks them up automatically.

## Updating the APK later

- **Inside the market** (listings, photos, prices, page design, admin tools): reaches
  everyone **automatically** — the app loads your live website. Nothing to do.
- **The app shell** (splash screen, app icon, offline screen): baked into the APK at
  build time. To change it, build a new APK and share it again:
  1. Bump `versionCode` + `versionName` in `app/build.gradle`.
  2. Build → Build APK(s) → share the new file.
  3. Phones with an **older build should uninstall it first**, then install the new one —
     Android blocks an "update" between APKs signed with different keys (error: "App not installed").

## Notes

- The APK needs internet — it's your live market, not an offline copy.
- Web push notifications don't fire inside this APK (Android WebView doesn't support web push).
  Listings, offers, chat and uploads all work.
- Bump `versionCode` / `versionName` in `app/build.gradle` when you rebuild for friends.
