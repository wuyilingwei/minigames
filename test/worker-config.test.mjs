import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const config = JSON.parse(await readFile(join(root, 'wrangler.jsonc'), 'utf8'));

if (config.name !== 'minigames') throw new Error('The Worker name must remain minigames.');
if (config.assets?.directory !== './dist') throw new Error('The Worker must publish dist/ as static assets.');
if (config.assets?.html_handling !== 'auto-trailing-slash') {
  throw new Error('Directory-based game entry pages need automatic trailing-slash handling.');
}
if (config.assets?.not_found_handling !== '404-page') throw new Error('Unknown URLs must return a 404 response.');

console.log('Verified the static Assets Worker configuration.');
