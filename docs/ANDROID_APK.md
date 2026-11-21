# THE STUDIO — Android APK

THE STUDIO has a native Android application target built with Capacitor. The simulation engines and interface remain shared web assets, bundled locally inside the Android application. The installed game does not need to open the GitHub Pages website to load its core interface and engines.

## Build an installable debug APK

Requirements:

- Node.js 22 or newer
- Android Studio and Android SDK
- Android SDK Platform 36 and Build Tools 36.0.0
- JDK 21 (Android Studio includes a compatible runtime)

From the repository root:

```bash
npm install
npm run build:web
npx cap add android
npm run android:prepare
npx cap sync android
npm run android:prepare
cd android
./gradlew assembleDebug
```

The debug APK is created at:

`android/app/build/outputs/apk/debug/app-debug.apk`

On Windows, use `gradlew.bat assembleDebug` instead of `./gradlew assembleDebug`.

## Automated builds

The Android APK workflow builds the debug APK for pushes to the development branch and pull requests targeting `main`. Download the generated APK from the workflow run's Artifacts section.

## Important release distinction

The debug APK is installable for development and device testing. A public release needs a protected Android signing key, signing configuration supplied through repository secrets, versioning, and a release validation pass. Never commit a keystore or signing passwords.

The Android application is a genuine APK with a native Android shell and locally bundled game runtime. The current game screens continue to render in Android WebView; this avoids rewriting the existing simulation and UI systems in Kotlin. Native Android capabilities can be added through Capacitor plugins as needed.
