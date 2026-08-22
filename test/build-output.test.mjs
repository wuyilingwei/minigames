import { access, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const output = join(root, 'dist');
const catalog = JSON.parse(await readFile(join(root, 'apps', 'portal', 'games.json'), 'utf8'));

async function mustExist(path) {
  await access(path);
  return path;
}

await Promise.all([
  mustExist(join(output, 'index.html')),
  mustExist(join(output, 'styles.css')),
  mustExist(join(output, 'app.js')),
  mustExist(join(output, 'games.json'))
]);

for (const game of catalog) {
  const entry = join(output, 'games', game.slug, 'index.html');
  await mustExist(entry);
  if (!(await stat(entry)).isFile()) throw new Error(`Expected a file: ${entry}`);
}

const home = await readFile(join(output, 'index.html'), 'utf8');
if (!home.includes('game-grid') || !home.includes('app.js')) {
  throw new Error('The portal home page is missing its collection mount point.');
}

console.log(`Verified ${catalog.length} game entries and the portal shell.`);

