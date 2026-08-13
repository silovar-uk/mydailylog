import { spawnSync } from 'node:child_process';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(projectRoot, 'docs');
const publicDir = path.join(projectRoot, 'public');
const errors = [];

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function localAssetUrls(html) {
  return [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)(?:[?#][^"]*)?"/g)]
    .map((match) => match[1]);
}

function arrayValues(source, variableName) {
  const match = source.match(new RegExp(`const ${variableName} = \\[([\\s\\S]*?)\\];`));
  if (!match) {
    errors.push(`${variableName} is missing from docs/sw.js.`);
    return [];
  }
  return [...match[1].matchAll(/['"](\.\/[^'"]+)['"]/g)].map((item) => item[1]);
}

const indexPath = path.join(outputDir, 'index.html');
const serviceWorkerPath = path.join(outputDir, 'sw.js');
const [indexHtml, serviceWorker] = await Promise.all([
  readFile(indexPath, 'utf8'),
  readFile(serviceWorkerPath, 'utf8'),
]);

if (indexHtml.includes('url=./docs/') || indexHtml.includes("location.replace('./docs/')")) {
  errors.push('docs/index.html contains the repository-root redirect instead of the app.');
}
if (!indexHtml.includes('<div id="app"></div>')) {
  errors.push('docs/index.html does not contain the application mount point.');
}
if (serviceWorker.includes('__BUILD_HASH__')) {
  errors.push('docs/sw.js still contains the build hash placeholder.');
}
if (!/const CACHE_NAME = 'mydailylog-[a-f0-9]{12}';/.test(serviceWorker)) {
  errors.push('docs/sw.js does not have a content-derived cache name.');
}

const indexAssets = [...new Set(localAssetUrls(indexHtml))];
const cachedAssets = new Set([
  ...arrayValues(serviceWorker, 'BUILD_ASSETS'),
  ...arrayValues(serviceWorker, 'APP_SHELL'),
]);

for (const asset of indexAssets) {
  const outputPath = path.join(outputDir, asset.slice(2));
  if (!(await exists(outputPath))) errors.push(`Referenced asset is missing: ${asset}`);
  if (!cachedAssets.has(asset)) errors.push(`Referenced asset is not in the offline cache: ${asset}`);
}

for (const asset of cachedAssets) {
  if (asset === './') continue;
  const outputPath = path.join(outputDir, asset.slice(2));
  if (!(await exists(outputPath))) errors.push(`Offline cache entry is missing: ${asset}`);
}

const publicFiles = await readdir(publicDir, { withFileTypes: true });
for (const entry of publicFiles) {
  if (!entry.isFile() || entry.name === 'sw.js') continue;
  const source = path.join(publicDir, entry.name);
  const output = path.join(outputDir, entry.name);
  if (!(await exists(output))) {
    errors.push(`Public asset was not copied: ${entry.name}`);
    continue;
  }
  const [sourceBytes, outputBytes] = await Promise.all([readFile(source), readFile(output)]);
  if (!sourceBytes.equals(outputBytes)) errors.push(`Public asset changed during build: ${entry.name}`);
}

const javaScriptFiles = (await readdir(outputDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
  .map((entry) => path.join(outputDir, entry.name));

for (const file of javaScriptFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) errors.push(`JavaScript syntax error in ${path.basename(file)}: ${result.stderr.trim()}`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`Verified ${indexAssets.length} page assets, ${cachedAssets.size} cache entries, and ${javaScriptFiles.length} scripts.`);
