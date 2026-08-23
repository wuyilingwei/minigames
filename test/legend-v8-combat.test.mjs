import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root=resolve(fileURLToPath(new URL('.',import.meta.url)),'..');
const html=await readFile(join(root,'games/cassandri-legend/index.html'),'utf8');
const runtime=await readFile(join(root,'games/cassandri-legend/game.js'),'utf8');
const start=runtime.indexOf('function normalizeCombatant(');
const end=runtime.indexOf('\nfunction runSaveKey(',start);
if(start<0||end<0)throw new Error('8.0 combat helpers are not extractable');
const context={console,player:{maxHp:1000,hp:100,slots:[]},save:{useBlood:3},print:()=>{},getElemCount:()=>({火:1,水:1,草:1,雷:1})};
vm.createContext(context);
vm.runInContext(runtime.slice(start,end),context);

const legacy={ZDYHP:75};context.normalizeCombatant(legacy);
if(legacy.shields.persistent!==75||context.shieldTotal(legacy)!==75)throw new Error('Legacy ZDYHP must normalize into persistent shield');
context.grantShield(legacy,'hits',40,2);context.grantShield(legacy,'temp',30);
let hit=context.absorbDamage(legacy,160);
if(hit.damage!==15||legacy.shields.hits.charges!==1||legacy.shields.temp!==0||legacy.shields.persistent!==0)throw new Error('Shield order must be hits, then temporary, then persistent');
context.player.hp=100;let healed=context.healPlayer(900,'test');
if(healed!==600||context.player.hp!==700)throw new Error('Difficulty 3 healing must cap each recovery at 60% max HP');
context.save.useBlood=10;context.player.hp=0;healed=context.healPlayer(1000,'test');
if(healed>600||healed<450)throw new Error('High-difficulty healing must decay and never exceed 60%');
context.setTemporaryShield(context.player,80);
if(context.restoreTemporaryShield(context.player,20,80)!==0||context.player.shields.temp!==80)throw new Error('Natural temporary shields must restore only to their combat cap');

const attackStart=runtime.indexOf('function getPlayerDodgeAgainst(');
const attackEnd=runtime.indexOf('\nfunction autoBattleDecide(',attackStart);
if(attackStart<0||attackEnd<0)throw new Error('Multi-hit combat helpers are not extractable');
const deterministicMath=Object.create(Math);deterministicMath.random=()=>0.99;
const attackContext={
  Math:deterministicMath,save:{useBlood:0},
  player:{hp:1000,maxHp:1000,atk:100,bj:.5,crt:0,energy:0,job:'战士',slots:[],ZBSPECIALUSED1:0},
  enemy:{name:'测试敌人',atk:100,hp:400,maxHp:500,tracking:.2,hits:2,traits:[{id:'lifesteal'},{id:'weaken'},{id:'curse'},{id:'dot'}]},
  hasETrait(id){return this.enemy.traits.some(trait=>trait.id===id);},hasTrait:()=>false,countTrait:()=>0,hasSet:()=>false,hasPrismaticResonance:()=>false,getPlayerDamageReductionFor:()=>0,
  absorbDamage:(_unit,amount)=>({damage:amount,absorbed:0}),print:()=>{},showBattleFeedback:()=>{},healPlayer:()=>0,getTraitProbMult:()=>1,rand:(a)=>a,pick:(items)=>items[0],
  applyEquipStats:()=>{},refreshStatPanel:()=>{},showEquip:()=>{},clearChoices:()=>{},addChoice:()=>{},autoSaveRun:()=>{},normalizeCombatant:()=>{},restoreTemporaryShield:()=>0
};
attackContext.hasETrait=attackContext.hasETrait.bind(attackContext);
vm.createContext(attackContext);vm.runInContext(runtime.slice(attackStart,attackEnd),attackContext);
attackContext.player.crt=.55;
if(Math.abs(attackContext.getPlayerDodgeAgainst(attackContext.enemy)-.35)>1e-9)throw new Error('Tracking must subtract additively from player dodge');
attackContext.player.crt=0;
if(attackContext.getEnemySegmentAttack(attackContext.enemy,2)!==56)throw new Error('Two-hit attacks must split a mildly increased turn budget rather than doubling full attack');
attackContext.resolveEnemyAttackSegment(1,2);attackContext.resolveEnemyAttackSegment(2,2);
if(attackContext.player.hp!==852||attackContext.player.energy!==20||attackContext.player.atk!==95||Math.abs(attackContext.player.bj-.48)>1e-9)throw new Error('Each enemy segment must independently apply damage, energy, weaken, curse, and unavoidable poison');
if(attackContext.enemy.hp!==426)throw new Error('Enemy lifesteal must resolve independently for each landed segment');
if(runtime.includes('enemyAttackLegacy'))throw new Error('The old single-hit attack implementation must not remain as dead compatibility code');
for(const marker of ['tracking:','dodge:','armor:','hits:','function enemyAttack(){','hasPrismaticResonance()','armorBreak','type==="temp"','persistent','【次数盾】'])if(!runtime.includes(marker))throw new Error(`Missing 8.0 combat marker: ${marker}`);
console.log('Verified Legend 8.0 shields, healing caps, tracking, split attacks, and per-segment effects.');
