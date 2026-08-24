import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const coverPath = resolve(import.meta.dirname, '../games/cassandri-legend/assets/cover.png');
const cover = readFileSync(coverPath);

assert.equal(cover.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
assert.equal(cover.readUInt32BE(16), cover.readUInt32BE(20), 'the game cover must be square');
assert.ok(cover.readUInt32BE(16) >= 1024, 'the cover must remain readable at large displays');
assert.ok(statSync(coverPath).size > 10_000, 'the cover must be a real raster asset');

console.log('legend mosaic cover: ok');
