import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(projectRoot, 'docs');
const serviceWorkerPath = path.join(outputDir, 'sw.js');
const indexPath = path.join(outputDir, 'index.html');

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  }));
  return files.flat();
}

let indexHtml = await readFile(indexPath, 'utf8');
const builtTagLines = indexHtml
  .split('\n')
  .filter((line) => line.includes('./assets/'));

if (builtTagLines.length === 0) {
  throw new Error('Vite-generated asset tags are missing from docs/index.html.');
}

indexHtml = indexHtml
  .split('\n')
  .filter((line) => !line.includes('./assets/'))
  .join('\n');

const insertionPoint = '  <style>.carry-over{display:none !important}</style>';
if (!indexHtml.includes(insertionPoint)) {
  throw new Error('Production asset insertion point is missing from docs/index.html.');
}

indexHtml = indexHtml.replace(
  insertionPoint,
  `${insertionPoint}\n${builtTagLines.join('\n')}`,
);
await writeFile(indexPath, indexHtml);

const outputFiles = (await listFiles(outputDir))
  .filter((file) => file !== serviceWorkerPath)
  .sort();

const hash = createHash('sha256');
for (const file of outputFiles) {
  hash.update(path.relative(outputDir, file));
  hash.update('\0');
  hash.update(await readFile(file));
  hash.update('\0');
}
const buildHash = hash.digest('hex').slice(0, 12);

const buildAssets = [...indexHtml.matchAll(/(?:src|href)="(\.\/assets\/[^"?#]+)(?:[?#][^"]*)?"/g)]
  .map((match) => match[1]);

let serviceWorker = await readFile(serviceWorkerPath, 'utf8');
if (!serviceWorker.includes('__BUILD_HASH__')) {
  throw new Error('Service worker cache placeholder is missing.');
}
if (!serviceWorker.includes('const BUILD_ASSETS = [];')) {
  throw new Error('Service worker build asset placeholder is missing.');
}

serviceWorker = serviceWorker
  .replaceAll('__BUILD_HASH__', buildHash)
  .replace(
    'const BUILD_ASSETS = [];',
    `const BUILD_ASSETS = ${JSON.stringify(buildAssets, null, 2)};`,
  );

await writeFile(serviceWorkerPath, serviceWorker);
console.log(`Finalized production cache ${buildHash} with ${buildAssets.length} built assets.`);
