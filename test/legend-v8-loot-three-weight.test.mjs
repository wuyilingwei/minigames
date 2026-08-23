import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const runtime = await readFile(resolve(root, 'games/cassandri-legend/game.js'), 'utf8');
const html = await readFile(resolve(root, 'games/cassandri-legend/index.html'), 'utf8');
const styles = await readFile(resolve(root, 'games/cassandri-legend/styles.css'), 'utf8');

const weightModel = runtime.match(/function getEquipmentPartWeights\(\)[\s\S]*?function genEquip\(wave\)\{/);
if (!weightModel) throw new Error('Could not extract equipment part weighting model.');
const getWeights = new Function('getSlotCount', `${weightModel[0].replace(/function genEquip\(wave\)\{$/, '')} return getEquipmentPartWeights();`);

const lowWeights = getWeights(() => 4);
if (lowWeights.some(item => item.part === 'accessory' || item.part === 'outerwear')) throw new Error('Low difficulty must not drop fifth-slot add-ons.');
const hardWeights = getWeights(() => 5);
const base = hardWeights.filter(item => ['head', 'body', 'oneHand', 'twoHand', 'offHand'].includes(item.part));
const addOn = hardWeights.filter(item => ['accessory', 'outerwear'].includes(item.part));
const baseWeight = base.reduce((sum, item) => sum + item.weight, 0);
const addOnWeight = addOn.reduce((sum, item) => sum + item.weight, 0);
if (addOn.length !== 2 || baseWeight !== 9 || addOnWeight !== 2) throw new Error('Expected five base entries at 1.5x each plus two add-on entries at 1x each.');
if (base.some(item => item.weight !== 1.5) || addOn.some(item => item.weight !== 1)) throw new Error('Base/add-on drop weights are incorrect.');

const pickerSource = runtime.match(/function getEquipmentPartWeights\(\)[\s\S]*?function genEquip\(wave\)\{/)[0].replace(/function genEquip\(wave\)\{$/, '') + runtime.match(/function pickWeightedEquipmentPart\(\)[\s\S]*?\n\}/)[0];
const pickPart = new Function('getSlotCount', 'Math', `${pickerSource}; return pickWeightedEquipmentPart;`)(() => 5, { random: () => 0.83 });
if (pickPart() !== 'accessory') throw new Error('Weighted picker must place the first add-on threshold after 9 total base weight.');

const recommendation = runtime.match(/function getRecommendedLootChoice\(\)[\s\S]*?\n\}/)[0];
const chooseRecommendation = new Function('pendingLoot', 'getEquipmentComparisons', `${recommendation}; return getRecommendedLootChoice();`)(
  { e1: { id: 1 }, e2: { id: 2 }, e3: { id: 3 } },
  item => [{ score: item.id === 3 ? 9 : item.id }],
);
if (chooseRecommendation?.chosenIdx !== 3) throw new Error('Automatic recommendation must be able to choose the third drop.');

if (!/let e3=genEquip\(\);[\s\S]*showLootChoice\(e1,e2,"loot",e3\)/.test(runtime)) throw new Error('Normal loot must generate and present three equipment drops.');
if (!/showLootChoice\(genEquip\(\),genEquip\(\),"bossLoot",genEquip\(\)\)/.test(runtime)) throw new Error('Boss loot must generate and present three equipment drops.');
if (!/function showLootChoice\(e1,e2,source,e3=null\)/.test(runtime)) throw new Error('Loot choice must accept an optional third item for old save compatibility.');
if (!/let drops=\[pendingLoot\.e1,pendingLoot\.e2,pendingLoot\.e3\]\.filter\(Boolean\)/.test(runtime)) throw new Error('Loot dialog must render all three drops and tolerate legacy two-item saves.');
if (!/pendingLoot\.e1,pendingLoot\.e2,pendingLoot\.e3/.test(runtime) || !/candidates\.reduce\(\(best,candidate\)=>candidate\.comparison\.score>best\.comparison\.score\?candidate:best\)/.test(runtime)) throw new Error('Automatic recommendation must consider and compare all three drops.');
if (!/for\(let key of \["e1","e2","e3"\]\)if\(normalized\.pendingLoot\[key\]\)/.test(runtime)) throw new Error('Run-save normalization must preserve optional third drops.');
if (!html.includes('每次掉落提供 3 件装备') || !html.includes('1.5 倍权重')) throw new Error('Changelog must document three-item drops and weighted base parts.');
if (!styles.includes('.loot-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));')) throw new Error('Desktop loot dialog must render three columns.');
if (!styles.includes('.modal-grid,.loot-grid,.set-grid{grid-template-columns:1fr;}')) throw new Error('Mobile loot dialog must collapse to one column.');
console.log('Verified three-item loot, legacy save compatibility, and 1.5x base-part weighting.');
