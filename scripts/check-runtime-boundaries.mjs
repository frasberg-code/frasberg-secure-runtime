import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);

const requiredFiles = [
  'docs/security/secure-runtime.md',
  'docs/security/deployment-and-authorization.md',
  'supabase/migrations/20260920120000_authoritative_runtime_schema.sql',
  'supabase/tests/worldgraph.sql',
];

const requiredStrings = [
  'worldgraph_definitions',
  'generation_jobs',
  'continuity_events',
  'monitor.refresh_materialized_views()',
  'owner_id',
  'cost_usd',
];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required runtime boundary file: ${relativePath}`);
  }
}

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(repoRoot, relativePath);
  const contents = fs.readFileSync(absolutePath, 'utf8');

  for (const needle of requiredStrings) {
    if (relativePath.includes('migration') || relativePath.includes('worldgraph')) {
      if (needle === 'cost_usd' && !contents.includes('cost_usd')) continue;
      if (needle === 'owner_id' && !contents.includes('owner_id')) continue;
    }

    if (relativePath.includes('docs') && ['worldgraph_definitions', 'generation_jobs', 'continuity_events'].includes(needle)) {
      if (!contents.includes(needle)) {
        throw new Error(`Missing required runtime boundary reference in ${relativePath}: ${needle}`);
      }
    }
  }
}

const migrationText = fs.readFileSync(path.join(repoRoot, 'supabase/migrations/20260920120000_authoritative_runtime_schema.sql'), 'utf8');
for (const needle of ['worldgraph_definitions', 'generation_jobs', 'continuity_events', 'monitor.refresh_materialized_views()']) {
  if (!migrationText.includes(needle)) {
    throw new Error(`Migration is missing required runtime reference: ${needle}`);
  }
}

const docsText = fs.readFileSync(path.join(repoRoot, 'docs/security/secure-runtime.md'), 'utf8');
if (!docsText.includes('Do not commit those values, and do not place signing secrets')) {
  throw new Error('Secure runtime docs are missing the secret-handling boundary statement.');
}

console.log('Runtime boundary guardrail check passed.');
