import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const catalog = JSON.parse(await readFile(join(root, 'apps', 'portal', 'games.json'), 'utf8'));
const script = await readFile(join(root, 'apps', 'portal', 'app.js'), 'utf8');
const styles = await readFile(join(root, 'apps', 'portal', 'styles.css'), 'utf8');
const legend = catalog.find(({ slug }) => slug === 'cassandri-legend');
const tenLightYears = catalog.find(({ slug }) => slug === 'ten-light-years');

assert.equal(legend?.cover, './games/cassandri-legend/assets/cover.png');
assert.equal(legend?.coverAlt, '卡桑德里传说船上银发人物马赛克封面');
assert.equal(tenLightYears?.cover, './games/ten-light-years/assets/preview.png');
assert.equal(tenLightYears?.coverAlt, '十光年的距离实际星图预览');
assert.match(script, /if \(game\.cover\)/);
assert.match(script, /cover\.className = 'card-cover'/);
assert.match(script, /cover\.alt = game\.coverAlt \|\| `\$\{game\.title\} 预览图`/);
assert.match(styles, /\.card-cover\s*\{/);
assert.match(styles, /mask-image:\s*linear-gradient/);

await access(join(root, 'dist', 'games', 'cassandri-legend', 'assets', 'cover.png'));
await access(join(root, 'dist', 'games', 'ten-light-years', 'assets', 'preview.png'));

console.log('Verified both game previews in the catalog, card rendering, and build output.');
