import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const html = await readFile(join(root, 'games', 'cassandri-legend', 'index.html'), 'utf8');

function requireText(text, message) {
  if (!html.includes(text)) throw new Error(`${message}: missing ${text}`);
}

requireText('.toggle input[type="checkbox"]{appearance:none;', 'Toggle checkboxes must use the shared custom control');
requireText('.toggle input[type="checkbox"]:checked::after', 'Checked toggles must animate their pixel check mark');
requireText('.toggle input[type="checkbox"]:focus-visible', 'Toggle checkboxes must expose keyboard focus');
requireText('.reduce-motion .toggle input[type="checkbox"]', 'The in-game reduced-motion setting must disable checkbox animation');
requireText('@media (prefers-reduced-motion:reduce)', 'The system reduced-motion preference must disable checkbox animation');
requireText('id="crtToggle"', 'Settings CRT checkbox must remain available');
requireText('id="reduceMotionToggle"', 'Settings animation checkbox must remain available');
requireText('id="collapseEventsToggle"', 'Settings event-collapse checkbox must remain available');
requireText('id="lootAutoSelect"', 'Loot auto-select checkbox must remain available');

console.log('Verified shared animated checkbox styles and reduced-motion fallbacks.');
