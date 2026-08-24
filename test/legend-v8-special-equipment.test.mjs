import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const runtime = await readFile(resolve(root, 'games/cassandri-legend/game.js'), 'utf8');
const special = runtime.match(/function makeEmergencyShield\(\)\{[\s\S]*?function prepareBattleShields\(\)\{[\s\S]*?\n\}/)?.[0];
if (!special) throw new Error('Could not extract special shield model.');
const model = new Function(`${special}
return { makeEmergencyShield, getEmergencyShield, triggerEmergencyShield, getEmergencyShieldValueForCharges, getEmergencyShieldValues };`)();

const logs = [];
const player = { slots: [model.makeEmergencyShield()], shields: { hits: { charges: 0, value: 0 }, temp: 0, persistent: 0 }, ZDYHP: 0, shield: 0, maxHp: 1000 };
const save = { useBlood: 6 };
function normalizeCombatant(unit) { unit.shields ||= { hits: { charges: 0, value: 0 }, temp: 0, persistent: 0 }; return unit; }
function grantShield(unit, type, value) { normalizeCombatant(unit); unit.shields[type] += value; unit.ZDYHP = unit.shields.temp + unit.shields.persistent; unit.shield = unit.ZDYHP; }
function print(message) { logs.push(message); }
function refreshStatPanel() {}
function applyEquipStats() {}
const trigger = new Function('player', 'save', 'normalizeCombatant', 'grantShield', 'print', 'refreshStatPanel', 'applyEquipStats', `${special}
return triggerEmergencyShield;`)(player, save, normalizeCombatant, grantShield, print, refreshStatPanel, applyEquipStats);

const expectedValues = [model.getEmergencyShieldValueForCharges(4, 6), model.getEmergencyShieldValueForCharges(3, 6), model.getEmergencyShieldValueForCharges(2, 6), model.getEmergencyShieldValueForCharges(1, 6)];
for (const expected of expectedValues) {
  player.shields.temp = 0;
  trigger();
  if (player.shields.temp !== expected) throw new Error(`Emergency shield did not grant ${expected} on its battle entry.`);
}
if (player.slots.some(item => item?.id === 'emergencyShield')) throw new Error('Emergency shield must be removed after the fourth trigger.');
if (!logs.some(line => line.includes('剩余3次') && line.includes(`下次${expectedValues[1]}`))) throw new Error('Remaining durability and scaled next shield amount must be logged.');
if (!logs.some(line => line.includes('第4次触发') && line.includes('损坏'))) throw new Error('Fourth trigger must log equipment damage.');

for (const text of ['makeEmergencyShield', 'name:"应急护盾"', 'part:"accessory"', 'emergencyCharges', 'function triggerEmergencyShield', 'function emergencyShieldValue(item)']) {
  if (!runtime.includes(text)) throw new Error(`Missing special equipment contract: ${text}`);
}
console.log('Verified emergency shield durability, ordered temporary shields, damage removal, and recommendation value contract.');
