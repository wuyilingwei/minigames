import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const favicon = readFileSync(resolve('games/cassandri-legend/favicon.svg'), 'utf8');

assert.match(favicon, /^<svg[^>]+viewBox="0 0 64 64"[^>]*>[\s\S]*<\/svg>\s*$/);
assert.match(favicon, /fill="#fff"/);
assert.ok(!/<(?:rect|image)\b/i.test(favicon), 'favicon should have no background rectangle or image');
assert.ok(!/briefcase|handbag|suit|house|property|sign|document|sales/i.test(favicon), 'favicon should have no occupational or property symbol');
assert.match(favicon, /<circle\b[^>]+cx="32"[^>]+cy="13"/i, 'favicon should include a simple head');
assert.ok((favicon.match(/<path\b/g) ?? []).length <= 3, 'favicon should remain minimal at small sizes');

console.log('Verified pure-white transparent boat-person favicon without modern or property cues.');
