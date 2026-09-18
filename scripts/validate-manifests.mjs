import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);
const manifestPaths = [
  'manifests/botbase.json',
  'manifests/frasberg-bot-signed.json',
  'manifests/operator.json',
];

for (const relativePath of manifestPaths) {
  const absolutePath = path.join(repoRoot, relativePath);
  const contents = fs.readFileSync(absolutePath, 'utf8');
  const manifest = JSON.parse(contents);

  if (!manifest.name || !manifest.version || !manifest.endpoints) {
    throw new Error(`Manifest ${relativePath} is missing required fields.`);
  }
}

console.log('Manifest validation passed.');
