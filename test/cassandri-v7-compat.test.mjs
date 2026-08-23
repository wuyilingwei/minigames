import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const sourcePath = join(root, 'games', 'cassandri-legend', 'index.html');
const html = await readFile(sourcePath, 'utf8');

function requireText(text, message) {
  if (!html.includes(text)) throw new Error(`${message}: missing ${text}`);
}

function requirePattern(pattern, message) {
  if (!pattern.test(html)) throw new Error(message);
}

// Version identity and the durable local-storage namespace must remain stable
// so an existing 6.x installation can reach the new runtime and save data.
requireText('7.0', 'The game must identify the 7.0-compatible runtime');
requireText('localStorage.getItem("kasandri6_save")', 'The legacy profile key must remain readable');
requireText('localStorage.setItem("kasandri6_save"', 'The legacy profile key must remain writable');
requireText('function normalizeSave(stored)', 'Profiles must be normalized before use');
for (const field of ['eyeTotal', 'blood', 'pointAtk', 'pointHp', 'pointBj', 'pointBs', 'pointCrt', 'useBlood', 'gold']) {
  requireText(field, `Profile compatibility must preserve ${field}`);
}

// 7.0's previously-stuck transitions are explicit resumable run states.
for (const state of ['equipLostConfirm', 'bossKnockoff']) {
  requireText(`"${state}"`, `Run saves must recognize the ${state} state`);
}
requireText('lastBattleSnapshot', 'Loot comparisons must retain the last battle snapshot');
requireText('function rememberLastBattle()', 'The battle snapshot must be captured before advancing');
requirePattern(/function snapshotRun\(\)[\s\S]*lastBattleSnapshot/, 'Run snapshots must persist the battle snapshot');
requirePattern(/function restoreRunSnapshot\([\s\S]*lastBattleSnapshot/, 'Run restores must recover the battle snapshot');
requirePattern(/function restoreRunSnapshot\([\s\S]*\.trait[\s\S]*\.traits/, 'Old single-trait equipment must migrate to the 7.0 traits array');
requirePattern(/function restoreRunSnapshot\([\s\S]*equipLostConfirm[\s\S]*bossKnockoff/, 'Restored interruption states must be handled explicitly');
requirePattern(/function restoreRunSnapshot\([\s\S]*equipLostConfirm[\s\S]*battleLoop\([\s\S]*bossKnockoff/, 'Restored interruption states must not jump straight into battleLoop');
requirePattern(/function nextWave\(\)[\s\S]*gameState="bossKnockoff"[\s\S]*gameState="bossLoot"/, 'The wave-to-BOSS loot transition must not dead-end');
requirePattern(/function genEnemy\([\s\S]*gameState="equipLostConfirm"[\s\S]*addChoice\("确认"/, 'Equipment loss must pause for an explicit confirmation');
requirePattern(/function battleLoop\([\s\S]*autoBattleDecide\([\s\S]*if\(!enemyAttack\(\)\)return/, 'Auto battle must stop cleanly after defeat or an interruption');

// New equipment/enemy data is additive: multiple traits and the 7.0 combat
// effects must render and participate in calculations without dropping the
// existing loot, set, difficulty, and navigation surfaces.
requirePattern(/function genEquip\([\s\S]*let traits=\[\][\s\S]*return \{[^}]*traits\}/, 'Equipment must use the multi-trait 7.0 shape');
requireText('function countTraitFor(slots,id)', 'Trait calculations must support multiple traits per equipment');
requireText('function equipmentRecommendationHtml(item)', 'Loot recommendation UI must remain available');
requireText('function getNextEnemyForecast()', 'The existing next-enemy recommendation must remain available');
requireText('function getExpectedCrit20xMultFor(slots)', 'The existing critical-hit expectation must remain available');
for (const trait of ['armorBreak', 'purify', 'antiHeal', 'trueStrike', 'revenge', 'secondWind']) {
  requireText(`id:"${trait}"`, `The 7.0 trait ${trait} must remain available`);
}
for (const surface of ['id="difficultyOverlay"', 'id="lootOverlay"', 'id="setOverlay"', 'id="btnExitToPortal"', '@media (max-width:760px)']) {
  requireText(surface, `Existing ${surface} surface must not be removed during integration`);
}
requireText('href="../../"', 'The game must retain its portal navigation');

console.log('Verified Cassandri 7.0 compatibility contracts and non-stalling transitions.');
