import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root=resolve(fileURLToPath(new URL('.',import.meta.url)),'..');
const html=await readFile(join(root,'games/cassandri-legend/index.html'),'utf8');
const start=html.indexOf('function normalizeCombatant(');
const end=html.indexOf('\nfunction runSaveKey(',start);
if(start<0||end<0)throw new Error('8.0 combat helpers are not extractable');
const context={console,player:{maxHp:1000,hp:100,slots:[]},save:{useBlood:3},print:()=>{},getElemCount:()=>({火:1,水:1,草:1,雷:1})};
vm.createContext(context);
vm.runInContext(html.slice(start,end),context);

const legacy={ZDYHP:75};context.normalizeCombatant(legacy);
if(legacy.shields.persistent!==75||context.shieldTotal(legacy)!==75)throw new Error('Legacy ZDYHP must normalize into persistent shield');
context.grantShield(legacy,'hits',40,2);context.grantShield(legacy,'temp',30);
let hit=context.absorbDamage(legacy,160);
if(hit.damage!==15||legacy.shields.hits.charges!==1||legacy.shields.temp!==0||legacy.shields.persistent!==0)throw new Error('Shield order must be hits, then temporary, then persistent');
context.player.hp=100;let healed=context.healPlayer(900,'test');
if(healed!==600||context.player.hp!==700)throw new Error('Difficulty 3 healing must cap each recovery at 60% max HP');
context.save.useBlood=10;context.player.hp=0;healed=context.healPlayer(1000,'test');
if(healed>600||healed<450)throw new Error('High-difficulty healing must decay and never exceed 60%');
for(const marker of ['tracking:','dodge:','armor:','hits:','function enemyAttack(){','hasPrismaticResonance()','armorBreak','【次数盾】','【临时盾】','【持续盾】'])if(!html.includes(marker))throw new Error(`Missing 8.0 combat marker: ${marker}`);
console.log('Verified Legend 8.0 shield normalization, ordered absorption, healing caps, and combat interfaces.');
