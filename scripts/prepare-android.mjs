import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const manifestPath = resolve('android/app/src/main/AndroidManifest.xml');
let manifest = await readFile(manifestPath, 'utf8');

const activityPattern = /(<activity\b(?=[^>]*android:name="[^"]*MainActivity")[^>]*)(>)/s;
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
console.log('Android MainActivity is locked to landscape orientation.');
