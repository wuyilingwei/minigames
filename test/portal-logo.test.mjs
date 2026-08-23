import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const logo = await readFile(join(root, 'apps', 'portal', 'portal-logo.svg'), 'utf8');
const home = await readFile(join(root, 'apps', 'portal', 'index.html'), 'utf8');

const rectangles = [...logo.matchAll(/<rect\b/g)];
if (rectangles.length !== 4) throw new Error(`Portal logo must contain exactly four rectangles; found ${rectangles.length}.`);
if (logo.match(/<rect\b[^>]*\bfill="none"/)) throw new Error('Portal logo rectangles must be solid.');
if (!/transform="rotate\(\s*[-+]?\d+(?:\.\d+)?\s+[^\"]+\)"/.test(logo)) throw new Error('Portal logo needs one visibly rotated square.');
if ((logo.match(/transform="rotate\(/g) ?? []).length !== 1) throw new Error('Portal logo must have exactly one rotated square.');
if (!home.includes('rel="icon"') || !home.includes('href="./portal-logo.svg"')) throw new Error('Portal favicon must reference portal-logo.svg.');
if (!home.includes('class="wordmark"') || !home.includes('src="./portal-logo.svg"')) throw new Error('Portal header must display portal-logo.svg beside the wordmark.');

console.log('Verified four-square portal logo geometry and favicon/header references.');
