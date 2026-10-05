import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPaths = [
  'manifests/botbase.json',
  'manifests/frasberg-bot-signed.json',
  'manifests/operator.json',
];

for (const relativePath of manifestPaths) {
  const absolutePath = path.join(repoRoot, relativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing manifest: ${relativePath}`);
  }

  const contents = fs.readFileSync(absolutePath, 'utf8');
  const manifest = JSON.parse(contents);

  if (!manifest.name || !manifest.version || !manifest.endpoints) {
    throw new Error(`Manifest ${relativePath} is missing required fields.`);
  }
}

console.log('Manifest validation passed.');
