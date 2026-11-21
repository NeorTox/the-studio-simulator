import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'www');
const excluded = new Set([
  '.git', '.github', 'node_modules', 'www', 'android', 'dist',
  '.gradle', '.idea', 'coverage', 'playwright-report', 'test-results'
]);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (excluded.has(entry.name) || entry.name.startsWith('.')) continue;
  const source = join(root, entry.name);
  const destination = join(output, entry.name);
  await cp(source, destination, {
    recursive: true,
    dereference: false,
    filter(candidate) {
      const rel = relative(root, candidate);
      if (!rel) return true;
      const segments = rel.split(sep);
      return !segments.some(segment => excluded.has(segment) || segment.startsWith('.'));
    }
  });
}

console.log('Prepared THE STUDIO web runtime in www/.');
