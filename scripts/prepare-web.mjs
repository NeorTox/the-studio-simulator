import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'www');
const excluded = new Set([
  '.git',
  '.github',
  'node_modules',
  'www',
  'android',
  'dist',
  '.gradle',
  '.idea',
  'coverage',
  'playwright-report',
  'test-results'
]);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

await cp(root, output, {
  recursive: true,
  dereference: false,
  filter(source) {
    const rel = relative(root, source);
    if (!rel) return true;
    const segments = rel.split(sep);
    if (segments.some(segment => excluded.has(segment))) return false;
    if (segments.some(segment => segment.startsWith('.'))) return false;
    return true;
  }
});

console.log('Prepared THE STUDIO web runtime in www/.');
