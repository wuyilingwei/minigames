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

requireText('let lootAutoSelectEnabled=false', 'Auto-select must default to off for every page load');
requireText('delete preferences.autoLootSelect', 'Legacy persisted auto-select values must be ignored');
requireText('id="lootAutoSelect"', 'The loot modal must expose the auto-select checkbox');
requireText('id="settingsAutoBattle"', 'Settings must expose the auto-battle session switch');
if (html.includes('id="settingsLootAutoSelect"')) throw new Error('Settings must not expose the loot auto-select switch');
requireText('lootAutoSelectRemaining=5', 'Auto-select must start with a five-second countdown');
requireText('5 秒后自动选择推荐装备', 'The five-second countdown intent must be visible in the loot modal');
requirePattern(/function toggleLootAutoSelect\(enabled\)[\s\S]*lootAutoSelectEnabled=Boolean\(enabled\)[\s\S]*syncLootAutoSelectControls\(\)[\s\S]*startLootAutoSelect\(\);[\s\S]*cancelLootAutoSelect\(\);/, 'Checking and unchecking must control the shared session switch and timer');
const toggleBody = html.match(/function toggleLootAutoSelect\(enabled\)\{[\s\S]*?\n\}/)?.[0] || '';
if (toggleBody.includes('writePreferences()')) throw new Error('Auto-select must not persist across page loads');
requirePattern(/function syncLootAutoSelectControls\(\)[\s\S]*getElementById\("lootAutoSelect"\)[\s\S]*lootAutoSelectEnabled/, 'The loot modal switch must stay synchronized with session state');
requirePattern(/function startLootAutoSelect\(\)[\s\S]*autoEquipRecommendedLoot\(\);/, 'The countdown must settle the recommendation through the dedicated auto-equip path');
requirePattern(/function startLootAutoSelect\(\)[\s\S]*lootAutoSelectRemaining--[\s\S]*lootAutoSelectRemaining===4\)flashRecommendedLootChoice\(\)/, 'The recommended border must flash about one second into an enabled countdown');
requirePattern(/function flashRecommendedLootChoice\(\)[\s\S]*!lootAutoSelectEnabled[\s\S]*data-loot-index[\s\S]*auto-select-target/, 'Only enabled auto-select may flash the recommended equipment border');
requirePattern(/function getRecommendedLootChoice\(\)[\s\S]*getEquipmentComparisons\(item\)\[0\][\s\S]*comparison\.score/, 'Auto-select must compare both drops with their best replacement slots');
requirePattern(/function autoEquipRecommendedLoot\(\)[\s\S]*getRecommendedLootChoice\(\)[\s\S]*comparison\.slotIndex[\s\S]*player\.slots\[slotIndex\]=best\.item[\s\S]*afterEquip\(/, 'Auto-select must use the best equipment and replacement slot, then close the loot flow');
requirePattern(/function autoEquipRecommendedLoot\(\)[\s\S]*lastEquipAction=\{slotIdx:slotIndex,oldEquip,newEquip:best\.item,chosenIdx:best\.chosenIdx\}[\s\S]*applyEquipStats\(\);[\s\S]*refreshStatPanel\(\);/, 'Auto-select must record and apply the selected equipment before settlement');
requirePattern(/function chooseLoot\(chosenIdx\)\{[\s\S]*cancelLootAutoSelect\(\);/, 'Manual selection must cancel the pending timer');
requirePattern(/function deferLootChoice\(\)[\s\S]*cancelLootAutoSelect\(\);/, 'Deferring loot must cancel the pending timer');
requirePattern(/function afterEquip\([\s\S]*cancelLootAutoSelect\(\);/, 'Settling loot must cancel the pending timer');
requirePattern(/function cancelLootAutoSelect\(\)[\s\S]*auto-select-target[\s\S]*lootAutoSelectToken\+\+/, 'Cancellation must remove the auto-select target emphasis');
requirePattern(/function renderReplacementChoices\([\s\S]*cancelLootAutoSelect\(\);/, 'Manual full-slot selection must retain the existing replacement flow');
requirePattern(/function setAutoBattle\(enabled\)[\s\S]*autoBattle=Boolean\(enabled\)[\s\S]*syncAutoBattleControl\(\)/, 'Settings and battle controls must share the auto-battle state');
requirePattern(/addChoice\("自动战斗",\(\)=>\{setAutoBattle\(true\)/, 'The battle action must synchronize the settings auto-battle switch');
requirePattern(/addChoice\("停止自动战斗",\(\)=>\{setAutoBattle\(false\)/, 'Stopping auto-battle must synchronize the settings switch');
for (const opener of ['showSetInfo', 'showDifficultyInfo', 'openShop', 'openSaveManager', 'openSettings']) {
  requirePattern(new RegExp(`function ${opener}\\([\\s\\S]*?cancelLootAutoSelect\\(\\);`), `${opener} must cancel a pending loot timer when switching overlays`);
}

console.log('Verified default-off five-second auto modes, target flash, and direct settlement contracts.');
