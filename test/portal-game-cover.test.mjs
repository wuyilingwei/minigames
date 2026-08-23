import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const catalog = JSON.parse(await readFile(join(root, 'apps', 'portal', 'games.json'), 'utf8'));
const script = await readFile(join(root, 'apps', 'portal', 'app.js'), 'utf8');
const styles = await readFile(join(root, 'apps', 'portal', 'styles.css'), 'utf8');
const legend = catalog.find(({ slug }) => slug === 'cassandri-legend');

assert.equal(legend?.cover, './games/cassandri-legend/assets/cover.png');
assert.match(script, /if \(game\.cover\)/);
assert.match(script, /cover\.className = 'card-cover'/);
assert.match(script, /cover\.alt = `\$\{game\.title\} 方块化封面`/);
assert.match(styles, /\.card-cover\s*\{/);
assert.match(styles, /mask-image:\s*linear-gradient/);

await access(join(root, 'dist', 'games', 'cassandri-legend', 'assets', 'cover.png'));

console.log('Verified the Cassandri block cover catalog, card rendering, and build output.');
