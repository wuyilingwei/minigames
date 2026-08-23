import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const html = await readFile(resolve(root, 'games/cassandri-legend/index.html'), 'utf8');
function requireText(text, message) {
  if (!html.includes(text)) throw new Error(`${message}: missing ${text}`);
}
function requirePattern(pattern, message) {
  if (!pattern.test(html)) throw new Error(message);
}

requireText('autoLootSelect:false', 'Auto-select must default to off for old preferences');
requireText('preferences.autoLootSelect=Boolean(enabled)', 'The checkbox must persist its preference');
requireText('id="lootAutoSelect"', 'The loot modal must expose the auto-select checkbox');
requireText('lootAutoSelectRemaining=3', 'Auto-select must start with a three-second countdown');
requireText('3 秒后自动选择推荐装备', 'The countdown intent must be visible to the player');
requirePattern(/function toggleLootAutoSelect\(enabled\)[\s\S]*writePreferences\(\)[\s\S]*if\(enabled\)startLootAutoSelect\(\);[\s\S]*cancelLootAutoSelect\(\);/, 'Checking and unchecking must persist and control the timer');
requirePattern(/function startLootAutoSelect\(\)[\s\S]*getEquipmentComparisons\(item\)\[0\]\.score[\s\S]*chooseLoot\(scores\[1\]>scores\[0\]\?2:1\)/, 'Auto-select must reuse the existing recommendation score and chooser');
requirePattern(/function chooseLoot\(chosenIdx\)\{[\s\S]*cancelLootAutoSelect\(\);/, 'Manual selection must cancel the pending timer');
requirePattern(/function deferLootChoice\(\)[\s\S]*cancelLootAutoSelect\(\);/, 'Deferring loot must cancel the pending timer');
requirePattern(/function afterEquip\([\s\S]*cancelLootAutoSelect\(\);/, 'Settling loot must cancel the pending timer');
requirePattern(/function renderReplacementChoices\([\s\S]*cancelLootAutoSelect\(\);/, 'A full-slot recommendation must enter the existing replacement flow');
for (const opener of ['showSetInfo', 'showDifficultyInfo', 'openShop', 'openSaveManager', 'openSettings']) {
  requirePattern(new RegExp(`function ${opener}\\([\\s\\S]*?cancelLootAutoSelect\\(\\);`), `${opener} must cancel a pending loot timer when switching overlays`);
}

console.log('Verified persistent three-second loot auto-select contracts.');
