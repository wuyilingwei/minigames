import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { resolve } from 'node:path';

const root=resolve(new URL('..',import.meta.url).pathname);
const runtime=await readFile(resolve(root,'games/cassandri-legend/game.js'),'utf8');

const scaleStart=runtime.indexOf('function hasPrismaticResonanceFor(');
const scaleEnd=runtime.indexOf('\nfunction getTraitMult(',scaleStart);
if(scaleStart<0||scaleEnd<0)throw new Error('Resonance helpers are not extractable');
const scaleContext={player:{slots:[]}};
vm.createContext(scaleContext);
vm.runInContext(runtime.slice(scaleStart,scaleEnd),scaleContext);
scaleContext.player.slots=[{element:'火'},{element:'水'},{element:'草'},{element:'雷'}];
if(scaleContext.elementSetScale()!==1.5||Math.abs(scaleContext.scaledElementEffect(.20)-.30)>1e-9)throw new Error('四色共鸣 must scale elemental effects by 1.5');
if(Math.abs(1+scaleContext.scaledElementEffect(.25)-1.375)>1e-9||Math.abs(1+scaleContext.scaledElementEffect(.10)-1.15)>1e-9)throw new Error('Fire set damage bonuses must scale the bonus portion, not the base multiplier');
scaleContext.player.slots=[{element:'火'},{element:'水'},{element:'草'},{element:'无'}];
if(scaleContext.elementSetScale()!==1||Math.abs(scaleContext.scaledElementEffect(.20)-.20)>1e-9)throw new Error('Partial elemental sets must retain their base effect');

const goldStart=runtime.indexOf('function getDifficultyGoldMultiplier(');
const goldEnd=runtime.indexOf('\nfunction renderDifficultyPanel(',goldStart);
if(goldStart<0||goldEnd<0)throw new Error('Difficulty gold helpers are not extractable');
const goldContext={save:{useBlood:0}};
vm.createContext(goldContext);vm.runInContext(runtime.slice(goldStart,goldEnd),goldContext);
if(goldContext.getDifficultyGoldMultiplier(0)!==1||goldContext.getDifficultyGoldMultiplier(10)!==2||goldContext.getDifficultyGoldReward(17,7)!==28)throw new Error('Difficulty gold must be level 0 ×1, level 10 ×2, and floor the payout');

const attackStart=runtime.indexOf('function getPlayerDodgeAgainst(');
const attackEnd=runtime.indexOf('\nfunction autoBattleDecide(',attackStart);
const deterministicMath=Object.create(Math);deterministicMath.random=()=>0.99;
const logs=[];
const combat={Math:deterministicMath,save:{useBlood:0},
  player:{hp:1000,maxHp:1000,atk:100,bj:0,crt:0,energy:0,slots:[{element:'火'},{element:'水'},{element:'草'},{element:'雷'}]},
  enemy:{name:'测试敌人',atk:100,hp:500,maxHp:500,tracking:0,hits:1,traits:[]},
  hasETrait:()=>false,hasTrait:()=>false,countTrait:()=>0,hasSet:()=>false,hasPrismaticResonance:()=>true,
  getPlayerDamageReductionFor:(_slots,{includeResonance}={})=>includeResonance===false?0:.12,absorbDamage:(_unit,amount)=>({damage:amount,absorbed:0}),print:(line)=>logs.push(line),showBattleFeedback:()=>{},healPlayer:()=>0,getTraitProbMult:()=>1,rand:(a)=>a,pick:(items)=>items[0],
  applyEquipStats:()=>{},refreshStatPanel:()=>{},showEquip:()=>{},clearChoices:()=>{},addChoice:()=>{},autoSaveRun:()=>{},normalizeCombatant:()=>{},restoreTemporaryShield:()=>0};
vm.createContext(combat);vm.runInContext(runtime.slice(attackStart,attackEnd),combat);
combat.resolveEnemyAttackSegment(1,1);
if(combat.player.hp!==896)throw new Error(`Expected additive resonance mitigation to reduce the landed hit to 104 damage, got ${combat.player.hp}`);
if(!logs.some(line=>line.includes('四色共鸣')&&line.includes('具体减免')))throw new Error('A landed hit must log concrete four-color resonance mitigation');

console.log('Verified executable resonance scaling, concrete mitigation logging, and difficulty gold multipliers.');
