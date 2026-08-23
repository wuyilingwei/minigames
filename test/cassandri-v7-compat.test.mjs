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
requireText('8.0', 'The game must identify the 8.0 runtime');
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
requirePattern(/function doAttackRound\([\s\S]*autoBattleDecide\([\s\S]*if\(!enemyAttack\(\)\)return/, 'Auto battle must stop cleanly after defeat or an interruption');

// New equipment/enemy data is additive: multiple traits and the 7.0 combat
// effects must render and participate in calculations without dropping the
// existing loot, set, difficulty, and navigation surfaces.
requirePattern(/function genEquip\([\s\S]*let traits=\[\][\s\S]*return \{[^}]*traits[^}]*\}/, 'Equipment must use the multi-trait equipment shape');
requireText('function countTraitFor(slots,id)', 'Trait calculations must support multiple traits per equipment');
requireText('function equipmentRecommendationHtml(item)', 'Loot recommendation UI must remain available');
requireText('function getNextEnemyForecast()', 'The existing next-enemy recommendation must remain available');
requireText('function getExpectedCrit20xMultFor(slots)', 'The existing critical-hit expectation must remain available');
if (html.includes('<div class="trait-note">预测：')) {
  throw new Error('Loot cards must not display the next-enemy forecast');
}
requirePattern(/function classifyRecommendation\([\s\S]*Math\.abs\(damage\)<0\.005&&Math\.abs\(survival\)<0\.005[\s\S]*text:"普通"[\s\S]*谨慎选择/, 'Nearly unchanged loot must be labeled as ordinary before the cautious tradeoff fallback');
for (const trait of ['armorBreak', 'purify', 'antiHeal', 'trueStrike', 'antiThorns', 'stealGuard', 'dotResist', 'critExecute', 'energyShield', 'revenge', 'shieldBash', 'secondWind']) {
  requireText(`id:"${trait}"`, `The 7.0 trait ${trait} must remain available`);
}
requireText('{id:"weaken",name:"虚弱",desc:"攻击命中后降低玩家3-5%攻击力"}', 'Weaken must retain its numeric effect description');
requireText('{id:"curse",name:"诅咒",desc:"攻击命中后降低玩家1-3%暴击率"}', 'Curse must retain its numeric effect description');
requirePattern(/if\(enemy\.traits&&enemy\.traits\.length>0\)[\s\S]*item\.textContent=`【\$\{trait\.name\}】\$\{trait\.desc\}`[\s\S]*enemyTraitDesc\.appendChild\(item\)/, 'The battle UI must render every enemy trait name and full description');
requireText('#terminal-wrap #battleArena .enemy .trait-note .trait-item{display:block', 'Multiple enemy trait descriptions must remain readable in the battle UI');
for (const behavior of ['CHEAT_SECRET', 'kasandri6_cheat_backup', 'function exitCheatMode()', 'player.energySurgeBoost', 'function tryEnemyTheft()', 'hasTrait("stealGuard")', 'if(save.blood<10)', '欢迎来到卡桑德里传说8.0']) {
  requireText(behavior, `The 7.0 behavior ${behavior} must remain implemented`);
}
for (const surface of ['id="difficultyOverlay"', 'id="lootOverlay"', 'id="setOverlay"', 'id="btnExitToPortal"', '@media (max-width:760px)']) {
  requireText(surface, `Existing ${surface} surface must not be removed during integration`);
}
requireText('href="../../"', 'The game must retain its portal navigation');

console.log('Verified Cassandri 7.0 compatibility contracts and non-stalling transitions.');
