import { access, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const output = join(root, 'dist');
const catalog = JSON.parse(await readFile(join(root, 'apps', 'portal', 'games.json'), 'utf8'));
const expectedCredits = new Map([
  ['cassandri-legend', '主创：槃清 · 编码：武乙凌薇'],
  ['ten-light-years', '美术、设计、编码：武乙凌薇 · 数据处理：StarryMiko2233']
]);

async function mustExist(path) {
  await access(path);
  return path;
}

await Promise.all([
  mustExist(join(output, 'index.html')),
  mustExist(join(output, 'styles.css')),
  mustExist(join(output, 'app.js')),
  mustExist(join(output, 'games.json'))
]);

for (const game of catalog) {
  const entry = join(output, 'games', game.slug, 'index.html');
  const sourceReadme = join(root, 'games', game.slug, 'README.md');
  const outputReadme = join(output, 'games', game.slug, 'README.md');
  await mustExist(entry);
  await mustExist(sourceReadme);
  await mustExist(outputReadme);
  if (!(await stat(entry)).isFile()) throw new Error(`Expected a file: ${entry}`);
  if (!game.credit) throw new Error(`Catalog entry ${game.slug} is missing its creator credit.`);
  if (game.credit !== expectedCredits.get(game.slug)) {
    throw new Error(`Catalog entry ${game.slug} has an unexpected creator credit.`);
  }
  if (await readFile(sourceReadme, 'utf8') !== await readFile(outputReadme, 'utf8')) {
    throw new Error(`The ${game.slug} README was not preserved in the build output.`);
  }
}

await Promise.all([
  mustExist(join(output, 'games', 'cassandri-legend', 'fonts', 'fusion-pixel-12px-proportional-zh_hans.otf.woff2')),
  mustExist(join(output, 'games', 'ten-light-years', 'main.js')),
  mustExist(join(output, 'games', 'ten-light-years', 'vendor', 'three.module.js')),
  mustExist(join(output, 'games', 'ten-light-years', 'data', 'stars.bin')),
  mustExist(join(output, 'games', 'ten-light-years', 'data', 'edges.bin')),
  mustExist(join(output, 'games', 'ten-light-years', 'data', 'edge_weights.bin')),
  mustExist(join(output, 'games', 'ten-light-years', 'data', 'tracks.json')),
  mustExist(join(output, 'games', 'ten-light-years', 'data', 'sizes.json')),
  mustExist(join(output, 'games', 'ten-light-years', 'audio', 'star-lalala.m4a')),
  mustExist(join(output, 'games', 'ten-light-years', 'audio', 'star-wish.m4a'))
]);

for (const asset of ['stars.bin', 'edges.bin', 'edge_weights.bin']) {
  const path = join(output, 'games', 'ten-light-years', 'data', asset);
  if ((await stat(path)).size === 0) throw new Error(`The binary star-map asset is empty: ${asset}`);
}

const cassandriHtml = await readFile(join(output, 'games', 'cassandri-legend', 'index.html'), 'utf8');
const cassandriStyles = await readFile(join(output, 'games', 'cassandri-legend', 'styles.css'), 'utf8');
const cassandriRuntime = await readFile(join(output, 'games', 'cassandri-legend', 'game.js'), 'utf8');
const cassandri = `${cassandriHtml}\n${cassandriStyles}\n${cassandriRuntime}`;
if (!cassandri.includes('fonts/fusion-pixel-12px-proportional-zh_hans.otf.woff2')) {
  throw new Error('The Cassandri Legend entry does not reference its packaged pixel font.');
}
if (!cassandri.includes('@media (max-width:760px)') || !cassandri.includes('#app{--mobile-topbar:68px;min-width:0') || !cassandri.includes('.modal-grid,.loot-grid,.set-grid{grid-template-columns:1fr')) {
  throw new Error('Cassandri Legend is missing its narrow-screen layout rules.');
}
if (!cassandri.includes('.overlay{inset:var(--mobile-topbar) 0 0') || !cassandri.includes('max-height:calc(100dvh - var(--mobile-topbar) - 24px)')) {
  throw new Error('Cassandri Legend mobile overlays must reserve the top bar area.');
}
if (!cassandri.includes('id="difficultyOverlay"') || !cassandri.includes('function showDifficultyInfo()') || !cassandri.includes('id="btnDifficultyPrev"') || !cassandri.includes('id="btnDifficultyNext"') || !cassandri.includes('id="difficultyMultiplier"') || !cassandri.includes('id="difficultyTraits"') || !cassandri.includes('id="difficultyEffects"')) {
  throw new Error('Cassandri Legend is missing its focus-based difficulty selection panel.');
}
if (!cassandri.includes('function getNextEnemyForecast()') || !cassandri.includes('function getExpectedCrit20xMultFor(slots)') || !cassandri.includes('function getComparisonTarget()') || !cassandri.includes('function rememberLastBattle()') || !cassandri.includes('lastBattleSnapshot')) {
  throw new Error('Cassandri Legend must retain the forecast and critical-hit recommendation while adding battle snapshots.');
}

const tenLightYears = await readFile(join(output, 'games', 'ten-light-years', 'index.html'), 'utf8');
if (!tenLightYears.includes('viewport-fit=cover') || !tenLightYears.includes('@media (pointer: coarse)')) {
  throw new Error('Ten Light Years is missing its touch-screen viewport and control rules.');
}
if (cassandri.includes('archive-exit') || tenLightYears.includes('archive-exit')) {
  throw new Error('A game exit control must be located in its settings menu, not fixed to the page.');
}
if (!cassandri.includes('id="btnExitToPortal"') || !cassandri.includes('href="../../"') || !cassandri.includes('返回迷你游戏')) {
  throw new Error('Cassandri Legend is missing its settings-menu exit control.');
}
if (!tenLightYears.includes('id="exit-game"') || !tenLightYears.includes('href="../../"') || !tenLightYears.includes('返回迷你游戏')) {
  throw new Error('Ten Light Years is missing its settings-menu exit control.');
}
const cassandriMenu = [
  cassandri.indexOf('id="btnContinue"'),
  cassandri.indexOf('id="btnNewGame"'),
  cassandri.indexOf('id="btnHomeSave"'),
  cassandri.indexOf('id="btnChangelog"'),
  cassandri.indexOf('id="btnHomeShop"'),
  cassandri.indexOf('id="btnHomeExitToPortal"')
];
if (cassandriMenu.some((index) => index < 0) || !cassandriMenu.every((index, position) => position === 0 || cassandriMenu[position - 1] < index)) {
  throw new Error('Cassandri Legend must order home actions as Continue, New Game, save, updates, shop, then exit.');
}
if (!cassandri.includes('id="btnHomeExitToPortal"') || !cassandri.includes('function requestReset()') || !cassandri.includes('function confirmReset()') || !cassandri.includes('确认施放') || !cassandri.includes('取消')) {
  throw new Error('Cassandri Legend is missing the home exit or explicit reset confirmation controls.');
}
if (!/<h3>潘多拉之盒<\/h3>[\s\S]*<h3>难度装备位<\/h3>[\s\S]*<h3>大记忆消失术<\/h3>/.test(cassandri)) {
  throw new Error('The manually triggered reset must be the final shop item.');
}

const home = await readFile(join(output, 'index.html'), 'utf8');
if (!home.includes('game-grid') || !home.includes('app.js') || !home.includes('迷你游戏') || !home.includes('id="about"') || !home.includes('本站作者：武乙凌薇')) {
  throw new Error('The portal home page is missing its game list or concise about information.');
}
if (home.includes('收录') || home.includes('静态发布') || home.includes('关于本站')) {
  throw new Error('The portal home page contains content outside the game list.');
}

const portalScript = await readFile(join(output, 'app.js'), 'utf8');
if (portalScript.includes('收录') || !portalScript.includes('款游戏')) {
  throw new Error('The portal game count does not match the simplified wording.');
}
const portalStyles = await readFile(join(output, 'styles.css'), 'utf8');
if (!portalStyles.includes('min-height: 44px') || !portalStyles.includes('@media (max-width: 680px)')) {
  throw new Error('The portal is missing its mobile card layout or tap-target sizing.');
}

console.log(`Verified ${catalog.length} game entries and the portal shell.`);
