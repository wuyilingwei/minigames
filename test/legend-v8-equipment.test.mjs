import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const html = await readFile(resolve(root, 'games/cassandri-legend/index.html'), 'utf8');
const runtime = await readFile(resolve(root, 'games/cassandri-legend/game.js'), 'utf8');
const model = runtime.match(/const allEquipmentParts=\[[\s\S]*?function initSlots\(\)\{[\s\S]*?\n\}/)?.[0];
const actionModel = runtime.match(/function buildEquipAction\(item,slotIndex,slots=player\.slots\)\{[\s\S]*?\n\}/)?.[0];
const manualLootModel = runtime.match(/function equipToSlot\(e,chosenIdx\)\{[\s\S]*?\n\}/)?.[0];
const replacementModel = runtime.match(/function renderReplacementChoices\(e,chosenIdx\)\{[\s\S]*?\n\}/)?.[0];
if (!model || !actionModel || !manualLootModel || !replacementModel) throw new Error('Could not extract the equipment model.');
if (!/renderReplacementChoices\(e,chosenIdx\);/.test(manualLootModel) || /confirmEquip\(\)/.test(manualLootModel)) throw new Error('Manual loot selection must always defer to explicit legal-slot choice, including when an empty slot exists.');
if (!replacementModel.includes('<p>空位</p>') || !replacementModel.includes('replaceEquip(${index},${chosenIdx})')) throw new Error('Replacement flow must present empty and occupied legal slots for an explicit player decision.');
for (const text of ['previousSlots:player.slots.slice()', 'player.slots=act.previousSlots', 'if(pendingLoot){', 'normalizeEquipmentSlots(normalized.player.slots']) {
  if (!runtime.includes(text)) throw new Error(`Equipment replacement persistence contract is missing: ${text}`);
}
const createModel = new Function('save', 'elements', `function isRecord(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}\n${model}\n${actionModel.replace('slots=player.slots', 'slots=[]')}\nreturn {equipmentSlots,getEquipmentSlots,normalizeEquipment,normalizeEquipmentSlots,buildEquipAction,getSlotCount,makeStarterEquipment,isEquipmentSetLegal};`);

const low = createModel({ slot5Unlocked: false, useBlood: 0 }, ['火', '水', '草', '雷']);
const starters = low.makeStarterEquipment();
if (low.getSlotCount() !== 4 || starters.some(item => item.element !== '无' || item.affixTier !== 0 || item.traits.length)) throw new Error('A new low-difficulty game must start with four un-affixed standard items.');
if (starters[0].hp !== 25 || starters[0].crt !== 0.02 || starters[1].hp !== 80 || starters[2].atk !== 15 || starters[2].bj !== 0.02 || starters[3].hp !== 35 || starters[3].crt !== 0.02) throw new Error('Starter equipment must provide the intended small combat stats.');
const hard = createModel({ slot5Unlocked: false, useBlood: 6 }, ['火', '水', '草', '雷']);
const shop = createModel({ slot5Unlocked: false, useBlood: 6, purchaseSlotUnlocked: true }, ['火', '水', '草', '雷']);
const shopLow = createModel({ slot5Unlocked: false, useBlood: 5, purchaseSlotUnlocked: true }, ['火', '水', '草', '雷']);
if (hard.getSlotCount() !== 5 || shop.getSlotCount() !== 6 || shopLow.getSlotCount() !== 5) throw new Error('Difficulty and purchase slots must be independent and continuous.');
for (const current of [low, hard, shop, shopLow]) {
  const definitions=current.getEquipmentSlots();
  if (definitions.map(slot => slot.name).join('/') !== definitions.map((_, index) => `装备 ${index + 1}`).join('/')) throw new Error('Every unlocked position must use a continuous generic equipment label.');
  if (definitions.some(slot => slot.accepts.join('/') !== 'head/body/oneHand/twoHand/offHand/accessory/outerwear')) throw new Error('Every unlocked position must accept the same universal equipment parts.');
}
const difficultyApply = runtime.match(/function applyDifficultySelection\(\)\{[\s\S]*?\n\}/)?.[0] || '';
if (!/save\.useBlood=difficultyDraft;[\s\S]*syncSlotCapacity\(\);/.test(difficultyApply)) throw new Error('Raising difficulty to 6 must immediately synchronize the fifth universal slot.');

const sword = { name: '短剑', part: 'oneHand', element: '火', atk: 1, hp: 0, bj: 0, bs: 0, crt: 0, traits: [] };
const shield = { name: '盾牌', part: 'offHand', element: '水', atk: 0, hp: 1, bj: 0, bs: 0, crt: 0, traits: [] };
const bow = { name: '长弓', part: 'twoHand', element: '雷', atk: 2, hp: 0, bj: 0, bs: 0, crt: 0, traits: [] };
const slots = [null, null, sword, shield, null];
const twoHandAction = hard.buildEquipAction(bow, 2, slots);
if (!twoHandAction || twoHandAction.slots[2]?.part !== 'twoHand' || twoHandAction.slots[3] !== null || twoHandAction.removed.some(entry => entry.equip?.name === shield.name) === false) throw new Error('A two-handed weapon must occupy the main hand and unequip the off hand.');
const dualAction = hard.buildEquipAction(sword, 3, [null, null, bow, null, null]);
if (!dualAction || dualAction.slots[2] !== null || dualAction.slots[3]?.part !== 'oneHand') throw new Error('An off-hand one-handed weapon must unequip a conflicting two-handed weapon.');
const armorInGenericSlot = hard.buildEquipAction({ ...shield, name: '轻甲', part: 'body' }, 2, slots);
if (!armorInGenericSlot || armorInGenericSlot.slots[2]?.part !== 'body') throw new Error('Body armor must be replaceable in any generic base slot without being mandatory.');
const fullStarter = [{ name: '头巾', part: 'head' }, { name: '布衣', part: 'body' }, sword, shield, null];
const armorReplacedByBow = hard.buildEquipAction(bow, 1, fullStarter);
if (!armorReplacedByBow || armorReplacedByBow.slots.some(item => item?.part === 'body') || armorReplacedByBow.slots.filter(item => item?.part === 'twoHand').length !== 1 || armorReplacedByBow.slots.some(item => ['oneHand', 'offHand'].includes(item?.part))) throw new Error('A player must be allowed to replace armor with a two-handed weapon while conflicting hand gear is removed.');
const twoSwords = hard.buildEquipAction({ ...sword, name: '第二把短剑' }, 3, [{ name: '头巾', part: 'head' }, { name: '布衣', part: 'body' }, sword, null, null]);
if (!twoSwords || twoSwords.slots.filter(item => item?.part === 'oneHand').length !== 2) throw new Error('Two one-handed weapons must remain a legal build.');
if (!hard.isEquipmentSetLegal([bow, null, null, null, null]) || hard.isEquipmentSetLegal([bow, { ...bow, name: '第二把长弓' }, null, null, null])) throw new Error('Exactly one two-handed weapon may be equipped.');
if (!hard.isEquipmentSetLegal([sword, shield, null, null, null]) || hard.isEquipmentSetLegal([sword, { ...sword, name: '第二把短剑' }, shield, null, null])) throw new Error('Hand combinations must allow sword plus shield or two swords, but never three hand items.');

const legacy = hard.normalizeEquipment({ name: '古老的大剑', atk: 4, hp: 5, trait: { id: 'armorBreak' } }, 2);
if (legacy.part !== 'twoHand' || !Array.isArray(legacy.traits) || legacy.traits.length !== 1) throw new Error('Legacy equipment must infer a part and migrate a single trait.');
if (legacy.affixTier !== 0) throw new Error('Legacy equipment without affixTier must migrate to standard tier.');
const migratedStarter = low.normalizeEquipment({ name: '朴素布衣', part: 'body', element: '无', hp: 0, crt: 0 }, 1);
if (migratedStarter.hp !== 80 || migratedStarter.affixTier !== 0) throw new Error('Old saved starter equipment must receive the new standard stats during normalization.');
const legacyCloak = hard.normalizeEquipment({ name: '旧披风', part: 'body', atk: 1 }, 1);
const legacyBoot = hard.normalizeEquipment({ name: '旧靴子', part: 'oneHand', hp: 2 }, 2);
if (legacyCloak.part !== 'outerwear' || legacyBoot.part !== 'outerwear') throw new Error('Legacy body/one-hand wearable items must migrate to the outerwear part by name.');
const armor = { name: '铠甲', part: 'body', element: '无', atk: 0, hp: 5, bj: 0, bs: 0, crt: 0, traits: [] };
const cloak = { name: '披风', part: 'outerwear', element: '风', atk: 1, hp: 2, bj: 0, bs: 0, crt: 0, traits: [] };
const migratedHard = hard.normalizeEquipmentSlots([null, armor, null, null, { ...cloak, part: 'body' }]);
if (migratedHard[1]?.part !== 'body' || migratedHard[4]?.part !== 'outerwear') throw new Error('Armor and a legacy body cloak must coexist in body and fifth slots.');
const migratedLow = low.normalizeEquipmentSlots([null, armor, null, null, cloak]);
if (!migratedLow.some(item => item?.part === 'outerwear')) throw new Error('Outerwear must be retained in an available base slot because all positions are universal.');
if (!hard.buildEquipAction(cloak, 1, [null, armor, null, null, null])) throw new Error('Outerwear must be replaceable into any universal equipment position.');
if (!hard.buildEquipAction(cloak, 4, [null, armor, null, null, null])) throw new Error('Outerwear must be equipable in the unlocked fifth slot alongside armor.');
const tierStart = runtime.indexOf('const equipmentTraitIdsByTier=');
const tierEnd = runtime.indexOf('\n\nconst elements=', tierStart);
const tierModel = tierStart >= 0 && tierEnd > tierStart ? runtime.slice(tierStart, tierEnd) : '';
if (!tierModel) throw new Error('Could not extract difficulty trait pools.');
const makeTierPool = new Function('traitList', `${tierModel}\nreturn getEquipmentTraitPool;`)([
  'attackHeal', 'armorBreak', 'reviveOnce', 'stealGuard',
].map(id => ({ id })));
if (makeTierPool(1).some(trait => trait.id === 'armorBreak')) throw new Error('Difficulty 3 must not expose tier-two armor break.');
if (!makeTierPool(2).some(trait => trait.id === 'armorBreak')) throw new Error('Difficulty 6 must unlock armor break.');
if (!makeTierPool(3).some(trait => trait.id === 'reviveOnce') || !makeTierPool(3).some(trait => trait.id === 'stealGuard')) throw new Error('Difficulty 9 must unlock rare tier-three effects.');
for (const [level, traits] of [[0, 0], [3, 1], [6, 2], [9, 3]]) {
  const expected = level === 0 ? 'let maxTraits=tier;' : 'let tier=save.useBlood>=9?3:save.useBlood>=6?2:save.useBlood>=3?1:0;';
  if (!runtime.includes(expected)) throw new Error(`Difficulty ${level} equipment trait tier is missing.`);
}
for (const text of ['id:"armorBreak"', 'trait.id==="armorBreak"', 'function buildEquipAction', 'function normalizeEquipmentSlots', 'const allEquipmentParts=["head","body","oneHand","twoHand","offHand","accessory","outerwear"]']) {
  if (!runtime.includes(text)) throw new Error(`Missing 8.0 equipment contract: ${text}`);
}
if (low.getEquipmentSlots().length !== 4 || hard.getEquipmentSlots()[4]?.id !== 'accessory' || shopLow.getEquipmentSlots()[4]?.id !== 'purchase') {
  throw new Error('Dynamic equipment definitions must expose the correct fifth slot for each unlock source.');
}
console.log('Verified 8.0 equipment slots, compatibility, legal combinations, and difficulty tiers.');
