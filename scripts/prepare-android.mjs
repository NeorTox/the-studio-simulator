import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const manifestPath = resolve('android/app/src/main/AndroidManifest.xml');
let manifest = await readFile(manifestPath, 'utf8');

const activityPattern = /(<activity\\b(?=[^>]*android:name="[^"]*MainActivity")[^>]*)(>)/s;
const match = manifest.match(activityPattern);
if (!match) {
  throw new Error('Could not find the Capacitor MainActivity in AndroidManifest.xml');
}

if (!/android:screenOrientation=/.test(match[1])) {
  manifest = manifest.replace(activityPattern, '$1 android:screenOrientation="landscape"$2');
} else {
  manifest = manifest.replace(activityPattern, (whole, opening, close) =>
    opening.replace(/android:screenOrientation="[^"]*"/, 'android:screenOrientation="landscape"') + close
  );
}

await writeFile(manifestPath, manifest);

// Capacitor's generated MainActivity is patched after every clean CI project
// generation, so the APK always launches as an immersive landscape application.
const activityPath = resolve('android/app/src/main/java/com/neortox/thestudio/MainActivity.java');
let activity = await readFile(activityPath, 'utf8');

if (!activity.includes('SYSTEM_UI_FLAG_IMMERSIVE_STICKY')) {
  if (!activity.includes('import android.os.Bundle;')) {
    activity = activity.replace(/(package [^;]+;\\s*)/, '$1\\nimport android.os.Bundle;\\nimport android.view.View;');
  }

  const classEnd = activity.lastIndexOf('}');
  if (classEnd < 0) {
    throw new Error('Could not find the end of generated MainActivity.java');
  }

  const immersiveMethods = `
    private void applyImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        );
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyImmersiveMode();
        }
    }
`;

  activity = activity.slice(0, classEnd) + immersiveMethods + activity.slice(classEnd);
  await writeFile(activityPath, activity);
}

console.log('Android MainActivity is locked to landscape and immersive full-screen mode.');
