import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const sourceEntry = join(root, 'games', 'ten-light-years', 'index.html');
const sourcePreview = join(root, 'games', 'ten-light-years', 'assets', 'preview.png');
const outputEntry = join(root, 'dist', 'games', 'ten-light-years', 'index.html');
const outputPreview = join(root, 'dist', 'games', 'ten-light-years', 'assets', 'preview.png');

const entry = await readFile(sourceEntry, 'utf8');
assert.match(entry, /<meta property="og:image" content="\.\/assets\/preview\.png">/);

for (const path of [sourcePreview, outputPreview]) await access(path);
for (const path of [sourcePreview, outputPreview]) {
  const data = await readFile(path);
  assert.deepEqual([...data.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${path} is not a PNG`);
  assert.equal(data.readUInt32BE(16), 1024, `${path} must be 1024px wide`);
  assert.equal(data.readUInt32BE(20), 1024, `${path} must be 1024px tall`);
  assert.ok((await stat(path)).size > 1000, `${path} is unexpectedly empty`);
}

const builtEntry = await readFile(outputEntry, 'utf8');
assert.match(builtEntry, /<meta property="og:image" content="\.\/assets\/preview\.png">/);
console.log('Verified the Ten Light Years preview PNG and og:image metadata in source and build output.');
