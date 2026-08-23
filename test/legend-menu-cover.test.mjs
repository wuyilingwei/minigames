import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const index = await readFile(resolve(root, 'games/cassandri-legend/index.html'), 'utf8');
const styles = await readFile(resolve(root, 'games/cassandri-legend/styles.css'), 'utf8');

assert.match(index, /id="welcomeOverlay"[^>]*class="overlay"/);
assert.match(index, /class="overlay-panel welcome-panel"/);
assert.match(index, /class="welcome-layout"/);
assert.match(index, /class="welcome-cover" src="\.\/assets\/cover\.png"/);
assert.match(index, /alt="卡桑德里传说西幻方块化封面"/);
assert.match(styles, /#welcomeOverlay \.welcome-layout\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(220px,300px\)/);
assert.match(styles, /#welcomeOverlay \.welcome-cover-frame\{[^}]*box-shadow:5px 5px 0 var\(--bg-deep\)/);
assert.match(styles, /@media \(max-width:760px\)[\s\S]*#welcomeOverlay \.welcome-layout\{grid-template-columns:1fr/);

const order = ['btnContinue', 'btnNewGame', 'btnHomeSave', 'btnChangelog', 'btnHomeShop', 'btnHomeExitToPortal'];
let cursor = -1;
for (const id of order) {
  const next = index.indexOf(`id="${id}"`);
  assert.ok(next > cursor, `${id} must preserve menu order`);
  cursor = next;
}

console.log('legend menu cover: ok');
