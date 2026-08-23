import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const html = await readFile(join(root, 'games', 'cassandri-legend', 'index.html'), 'utf8');

function requireText(text, message) {
  if (!html.includes(text)) throw new Error(`${message}: missing ${text}`);
}

requireText('.toggle input[type="checkbox"]{appearance:none;', 'Toggle checkboxes must use the shared custom control');
requireText('.loot-auto-toggle input[type="checkbox"]{appearance:none;', 'Auto-select must use the shared pixel switch control');
requireText('.loot-auto-toggle input[type="checkbox"]::before', 'Pixel switches must expose a decorative sliding block');
requireText('.loot-auto-toggle input[type="checkbox"]:checked::before', 'Checked pixel switches must move the sliding block');
requireText('.loot-auto-toggle input[type="checkbox"]:active', 'Pixel switches must expose an active state');
requireText('.toggle input[type="checkbox"]:checked::after', 'Checked toggles must animate their pixel check mark');
requireText('content:"";position:absolute;left:4px', 'The check mark must remain decorative and absent from accessibility text');
requireText('.toggle input[type="checkbox"]:focus-visible', 'Toggle checkboxes must expose keyboard focus');
requireText('.reduce-motion .toggle input[type="checkbox"]', 'The in-game reduced-motion setting must disable checkbox animation');
requireText('@media (prefers-reduced-motion:reduce)', 'The system reduced-motion preference must disable checkbox animation');
requireText('.loot-choice.auto-select-target{', 'Auto-select targets must have a dedicated recommendation state');
requireText('@keyframes autoSelectTargetPulse', 'Auto-select targets must blink their recommendation border once');
requireText('.reduce-motion .loot-choice.auto-select-target', 'The in-game reduced-motion setting must keep a static target emphasis');
requireText('id="crtToggle"', 'Settings CRT checkbox must remain available');
requireText('id="reduceMotionToggle"', 'Settings animation checkbox must remain available');
requireText('id="collapseEventsToggle"', 'Settings event-collapse checkbox must remain available');
requireText('id="lootAutoSelect"', 'Loot auto-select checkbox must remain available');

console.log('Verified shared animated checkbox styles and reduced-motion fallbacks.');
