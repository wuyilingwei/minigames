import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { resolve } from 'node:path';

const root=resolve(new URL('..',import.meta.url).pathname);
const runtime=await readFile(resolve(root,'games/cassandri-legend/game.js'),'utf8');
const start=runtime.indexOf('function autoBattleDecide()');
const end=runtime.indexOf('\nfunction simulateBossSkip()',start);
if(start<0||end<0)throw new Error('Attack-round helpers are not extractable');

function runFullEnergyAttack(autoBattle){
  const calls=[];
  const context={
    gamePaused:false,autoBattle,
    player:{atk:100,defendStack:0,energy:100,hp:1000,maxHp:1000,job:'',blessing:'',slots:[]},
    enemy:{hp:1000,atk:10,hits:1,tracking:0},save:{useBlood:0},
    hasETrait:()=>false,getPlayerDodgeAgainst:()=>0,getPlayerDamageReductionFor:()=>0,
    jobEffectMultiplier:()=>1,countTrait:()=>0,getHealingCapForMissing:()=>Infinity,shieldTotal:()=>0,
    playerAttack:()=>calls.push('attack'),burstAttack:()=>calls.push('burst'),
    onEnemyDefeat:()=>calls.push('enemy-defeat'),applyDots:()=>calls.push('dots'),
    enemyAttack:()=>false,onPlayerDefeat:()=>calls.push('player-defeat'),
    scheduleAutoBattleStep:()=>calls.push('schedule'),battleLoop:()=>calls.push('loop'),print:()=>{}
  };
  vm.createContext(context);
  vm.runInContext(runtime.slice(start,end),context);
  context.doAttackRound();
  return calls;
}

for(const autoBattle of [false,true]){
  const calls=runFullEnergyAttack(autoBattle);
  if(calls.includes('burst')||calls[0]!=='attack'){
    throw new Error(`${autoBattle?'Auto battle':'Regular attack'} must use a normal attack at full energy; got ${calls.join(', ')}`);
  }
}

const battleLoopStart=runtime.indexOf('function battleLoop()');
const battleLoopEnd=runtime.indexOf('\nfunction playEnemyDefeatAnimation(',battleLoopStart);
const battleLoop=runtime.slice(battleLoopStart,battleLoopEnd);
if(!/addChoice\("必杀技",\(\)=>\{burstAttack\(\)/.test(battleLoop)){
  throw new Error('A full-energy player must retain the explicit 必杀技 action');
}

console.log('Verified full-energy regular and auto attacks remain normal attacks, with an explicit burst action retained.');
