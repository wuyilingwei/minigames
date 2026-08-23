import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const gameDir = resolve(root, 'games/cassandri-legend');
const index = readFileSync(resolve(gameDir, 'index.html'), 'utf8');
const favicon = readFileSync(resolve(gameDir, 'favicon.svg'), 'utf8');
const coverPath = resolve(gameDir, 'assets/cover.png');

assert.match(index, /<link\s+rel="icon"\s+type="image\/svg\+xml"\s+href="\.\/favicon\.svg"\s*\/?\s*>/i);
assert.match(index, /<meta\s+property="og:image"\s+content="\.\/assets\/cover\.png"\s*\/?\s*>/i);
assert.match(favicon, /^<svg[^>]+viewBox="0 0 64 64"[^>]*>[\s\S]*<\/svg>\s*$/);
assert.match(favicon, /fill="#fff"/);
assert.doesNotMatch(favicon, /<(?:rect|image)\b[^>]*fill="(?:#fff|white)"/i);
assert.ok(!favicon.includes('<rect'), 'favicon should remain a minimal silhouette without background rectangle');
assert.ok(existsSync(coverPath), 'generated cover must be present in the game directory');
const cover = readFileSync(coverPath);
assert.equal(cover.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
assert.ok(statSync(coverPath).size > 10_000, 'cover should be a real raster asset, not a placeholder');

console.log('legend brand assets: ok');
