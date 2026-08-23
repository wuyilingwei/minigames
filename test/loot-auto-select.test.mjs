import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const html = await readFile(resolve(root, 'games/cassandri-legend/index.html'), 'utf8');
const runtime = await readFile(resolve(root, 'games/cassandri-legend/game.js'), 'utf8');
const styles = await readFile(resolve(root, 'games/cassandri-legend/styles.css'), 'utf8');
const source = `${html}\n${styles}\n${runtime}`;
function requireText(text, message) {
  if (!source.includes(text)) throw new Error(`${message}: missing ${text}`);
}
function requirePattern(pattern, message) {
  if (!pattern.test(source)) throw new Error(message);
}

requireText('let lootAutoSelectEnabled=false', 'Auto-select must default to off for every page load');
requireText('delete preferences.autoLootSelect', 'Legacy persisted auto-select values must be ignored');
requireText('id="lootAutoSelect"', 'The loot modal must expose the auto-select checkbox');
requireText('id="settingsAutoBattle"', 'Settings must expose the auto-battle session switch');
requireText('id="settingsLootAutoSelect"', 'Settings must expose the loot auto-select session switch');
requireText('lootAutoSelectRemaining=5', 'Auto-select must start with a five-second countdown');
requireText('"自动选择推荐装备":"自动放弃本次装备"', 'The countdown must explain whether it will equip or decline the loot');
requirePattern(/function toggleLootAutoSelect\(enabled\)[\s\S]*lootAutoSelectEnabled=Boolean\(enabled\)[\s\S]*syncLootAutoSelectControls\(\)[\s\S]*startLootAutoSelect\(\);[\s\S]*cancelLootAutoSelect\(\);/, 'Checking and unchecking must control the shared session switch and timer');
requirePattern(/settingsLootAutoSelect\.onchange=\(\)=>toggleLootAutoSelect\(settingsLootAutoSelect\.checked\)/, 'Settings auto-select must control the shared session switch');
const toggleBody = runtime.match(/function toggleLootAutoSelect\(enabled\)\{[\s\S]*?\n\}/)?.[0] || '';
if (toggleBody.includes('writePreferences()')) throw new Error('Auto-select must not persist across page loads');
requirePattern(/function syncLootAutoSelectControls\(\)[\s\S]*for\(let id of \["lootAutoSelect","settingsLootAutoSelect"\]\)[\s\S]*lootAutoSelectEnabled/, 'The loot and settings switches must stay synchronized with session state');
requirePattern(/function startLootAutoSelect\(\)[\s\S]*autoResolveLootChoice\(\);/, 'The countdown must settle loot through the automatic resolution path');
requirePattern(/function startLootAutoSelect\(\)[\s\S]*lootAutoSelectRemaining--[\s\S]*lootAutoSelectRemaining===4\)flashRecommendedLootChoice\(\)/, 'The recommended border must flash about one second into an enabled countdown');
requirePattern(/function flashRecommendedLootChoice\(\)[\s\S]*!lootAutoSelectEnabled[\s\S]*best\.comparison\.score>0[\s\S]*auto-select-target/, 'Only enabled auto-select with a positive gain may flash the recommended equipment border');
requirePattern(/function getRecommendedLootChoice\(\)[\s\S]*getEquipmentComparisons\(item\)\[0\][\s\S]*comparison\.score/, 'Auto-select must compare both drops with their best replacement slots');
requirePattern(/function autoResolveLootChoice\(\)[\s\S]*best\.comparison\.score>0\)autoEquipRecommendedLoot\(\);[\s\S]*else autoDeclineLoot\(\);/, 'Automatic loot resolution must equip positive gains and decline zero or negative gains');
const resolverSource = runtime.match(/function autoResolveLootChoice\(\)\{[\s\S]*?\n\}/)?.[0] || '';
function runAutoResolution(score) {
  let equipped = 0;
  let declined = 0;
  const resolve = new Function('getRecommendedLootChoice', 'autoEquipRecommendedLoot', 'autoDeclineLoot', `${resolverSource};return autoResolveLootChoice;`)(
    () => ({ comparison: { score } }),
    () => { equipped++; },
    () => { declined++; },
  );
  resolve();
  return { equipped, declined };
}
for (const [score, expected] of [[1, { equipped: 1, declined: 0 }], [0, { equipped: 0, declined: 1 }], [-1, { equipped: 0, declined: 1 }]]) {
  const actual = runAutoResolution(score);
  if (actual.equipped !== expected.equipped || actual.declined !== expected.declined) {
    throw new Error(`Auto resolution failed for score ${score}: ${JSON.stringify(actual)}`);
  }
}
requirePattern(/function autoEquipRecommendedLoot\(\)[\s\S]*getRecommendedLootChoice\(\)[\s\S]*comparison\.action[\s\S]*player\.slots=action\.slots[\s\S]*afterEquip\(/, 'Auto-select must apply the best legal equipment action, then close the loot flow');
requirePattern(/function autoEquipRecommendedLoot\(\)[\s\S]*if\(!best\|\|best\.comparison\.score<=0\)\{autoDeclineLoot\(\);return;\}/, 'Auto-equip must fall back to automatic decline for zero or negative gains');
requirePattern(/function autoDeclineLoot\(\)[\s\S]*两件装备都没有正收益[\s\S]*afterEquip\(/, 'Automatic decline must close the loot flow without player intervention');
requirePattern(/function autoEquipRecommendedLoot\(\)[\s\S]*lastEquipAction=\{\.\.\.action,chosenIdx:best\.chosenIdx,previousSlots:player\.slots\.slice\(\)\}[\s\S]*applyEquipStats\(\);[\s\S]*refreshStatPanel\(\);/, 'Auto-select must record and apply the selected legal action before settlement');
requirePattern(/function chooseLoot\(chosenIdx\)\{[\s\S]*cancelLootAutoSelect\(\);/, 'Manual selection must cancel the pending timer');
requirePattern(/function deferLootChoice\(\)[\s\S]*cancelLootAutoSelect\(\);/, 'Deferring loot must cancel the pending timer');
requirePattern(/function showDeferredLootAction\(\)\{[\s\S]*clearChoices\(\);[\s\S]*addChoice\("继续选择装备",resumeLootChoice,"loot-resume-action"\);/, 'Deferred loot must render its resume action in the bottom choice area');
requirePattern(/function deferLootChoice\(\)[\s\S]*showDeferredLootAction\(\);[\s\S]*autoSaveRun\(\);/, 'Deferring loot must immediately show the bottom resume action');
requirePattern(/if\(gameState==="loot"\|\|gameState==="bossLoot"\)\{[\s\S]*if\(lootDeferred\)showDeferredLootAction\(\);[\s\S]*else showLootChoice/, 'Restoring a deferred loot save must rebuild the bottom resume action');
const statPanelBody = runtime.slice(runtime.indexOf('function refreshStatPanel()'), runtime.indexOf('function genEquip('));
if (statPanelBody.includes('继续选择装备')) throw new Error('The hero panel must no longer contain the deferred loot resume action');
requireText('#choices .loot-resume-action', 'The relocated resume action must retain visible accent styling');
requirePattern(/function afterEquip\([\s\S]*cancelLootAutoSelect\(\);/, 'Settling loot must cancel the pending timer');
requirePattern(/function cancelLootAutoSelect\(\)[\s\S]*auto-select-target[\s\S]*lootAutoSelectToken\+\+/, 'Cancellation must remove the auto-select target emphasis');
requirePattern(/function renderReplacementChoices\([\s\S]*cancelLootAutoSelect\(\);/, 'Manual full-slot selection must retain the existing replacement flow');
requirePattern(/function setAutoBattle\(enabled\)[\s\S]*autoBattle=Boolean\(enabled\)[\s\S]*syncAutoBattleControl\(\)/, 'Settings and battle controls must share the auto-battle state');
requirePattern(/function scheduleAutoBattleStep\(callback\)[\s\S]*!autoBattle\|\|gamePaused[\s\S]*callback\(\)/, 'Auto battle steps must stop while disabled or paused');
requirePattern(/function setAutoBattle\(enabled\)[\s\S]*cancelAutoBattleStep\(\)[\s\S]*autoBattle=Boolean\(enabled\)/, 'Changing auto battle must cancel any stale queued step');
requirePattern(/settingsAutoBattle\.onchange=\(\)=>setAutoBattle\(settingsAutoBattle\.checked\)/, 'Settings auto-battle must control the shared session switch');
requirePattern(/function closeSettings\(\)[\s\S]*autoBattle\|\|autoBattle!==autoBattleBeforeSettings[\s\S]*battleLoop\(\)/, 'Closing settings after an auto-battle change must immediately resume the battle loop');
requirePattern(/addChoice\("自动战斗",\(\)=>\{setAutoBattle\(true\)/, 'The battle action must synchronize the settings auto-battle switch');
requirePattern(/addChoice\("停止自动战斗",\(\)=>\{setAutoBattle\(false\)/, 'Stopping auto-battle must synchronize the settings switch');
for (const opener of ['showSetInfo', 'showDifficultyInfo', 'openShop', 'openSaveManager', 'openSettings']) {
  requirePattern(new RegExp(`function ${opener}\\([\\s\\S]*?cancelLootAutoSelect\\(\\);`), `${opener} must cancel a pending loot timer when switching overlays`);
}
for (const closer of ['closeDifficultyPanel', 'closeShop', 'closeSaveManager', 'closeSettings']) {
  requirePattern(new RegExp(`function ${closer}\\([\\s\\S]*?resumeLootAutoSelectIfReady\\(\\);`), `${closer} must resume enabled auto-select after its overlay closes`);
}

console.log('Verified default-off five-second auto modes, target flash, and direct settlement contracts.');
