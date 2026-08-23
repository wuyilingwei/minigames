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
  if (!game.credit) throw new Error(`Catalog entry ${game.slug} is missing its creator credit.`);
}

await Promise.all([
  mustExist(join(output, 'games', 'cassandri-legend', 'fonts', 'fusion-pixel-12px-proportional-zh_hans.otf.woff2')),
  mustExist(join(output, 'games', 'ten-light-years', 'main.js')),
  mustExist(join(output, 'games', 'ten-light-years', 'vendor', 'three.module.js')),
  mustExist(join(output, 'games', 'ten-light-years', 'data', 'stars.bin')),
  mustExist(join(output, 'games', 'ten-light-years', 'data', 'edges.bin')),
  mustExist(join(output, 'games', 'ten-light-years', 'data', 'edge_weights.bin')),
  mustExist(join(output, 'games', 'ten-light-years', 'data', 'tracks.json')),
  mustExist(join(output, 'games', 'ten-light-years', 'data', 'sizes.json')),
  mustExist(join(output, 'games', 'ten-light-years', 'audio', 'star-lalala.m4a')),
  mustExist(join(output, 'games', 'ten-light-years', 'audio', 'star-wish.m4a'))
]);

for (const asset of ['stars.bin', 'edges.bin', 'edge_weights.bin']) {
  const path = join(output, 'games', 'ten-light-years', 'data', asset);
  if ((await stat(path)).size === 0) throw new Error(`The binary star-map asset is empty: ${asset}`);
}

const cassandri = await readFile(join(output, 'games', 'cassandri-legend', 'index.html'), 'utf8');
if (!cassandri.includes('fonts/fusion-pixel-12px-proportional-zh_hans.otf.woff2')) {
  throw new Error('The Cassandri Legend entry does not reference its packaged pixel font.');
}

const tenLightYears = await readFile(join(output, 'games', 'ten-light-years', 'index.html'), 'utf8');
for (const [slug, entry] of [
  ['cassandri-legend', cassandri],
  ['ten-light-years', tenLightYears]
]) {
  if (!entry.includes('class="archive-exit"') || !entry.includes('href="../../"')) {
    throw new Error(`The ${slug} entry is missing its return-to-portal exit control.`);
  }
}

const home = await readFile(join(output, 'index.html'), 'utf8');
if (!home.includes('game-grid') || !home.includes('app.js') || !home.includes('小游戏站')) {
  throw new Error('The portal home page is missing its collection mount point.');
}

console.log(`Verified ${catalog.length} game entries and the portal shell.`);
