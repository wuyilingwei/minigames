import { cp, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const portal = join(root, 'apps', 'portal');
const gameRoot = join(root, 'games');
const output = join(root, 'dist');
const catalog = JSON.parse(await readFile(join(portal, 'games.json'), 'utf8'));

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function fileCount(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const counts = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? fileCount(path) : 1;
  }));
  return counts.reduce((total, count) => total + count, 0);
}

assert(Array.isArray(catalog) && catalog.length > 0, 'The game catalog must contain at least one entry.');
assert(new Set(catalog.map(({ slug }) => slug)).size === catalog.length, 'Every game slug must be unique.');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(portal, output, { recursive: true });

for (const game of catalog) {
  assert(/^[a-z0-9-]+$/.test(game.slug), `Invalid game slug: ${game.slug}`);
  assert(game.title && game.description && game.action, `Catalog entry ${game.slug} is incomplete.`);

  const source = join(gameRoot, game.slug);
  const entry = join(source, 'index.html');
  const destination = join(output, 'games', game.slug);
  assert((await stat(entry)).isFile(), `Missing entry file: games/${game.slug}/index.html`);
  await mkdir(join(output, 'games'), { recursive: true });
  await cp(source, destination, { recursive: true });
}

console.log(`Built ${catalog.length} entries and ${await fileCount(output)} static files in dist/.`);
