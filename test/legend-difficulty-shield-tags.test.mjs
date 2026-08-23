import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(new URL('..',import.meta.url).pathname);
const runtime=await readFile(resolve(root,'games/cassandri-legend/game.js'),'utf8');
const start=runtime.indexOf('function getEmergencyShieldValueForCharges(');
const end=runtime.indexOf('\nfunction renderDifficultyPanel(',start);
if(start<0||end<0)throw new Error('Difficulty shield/tag helpers are not extractable');
const model=new Function('save',`${runtime.slice(start,end)}\nreturn {getEmergencyShieldValueForCharges,getEmergencyShieldValues,getHealingRecoveryRate,getDifficultyRules,getDifficultyRuleTags,getDifficultyRuleDetails};`)({useBlood:0});

for(const level of [6,7,8,9,10]){
  const values=model.getEmergencyShieldValues(level);
  const expected=[100,75,50,25].map(base=>Math.floor(base*Math.pow(1.18,level)));
  if(JSON.stringify(values)!==JSON.stringify(expected))throw new Error(`Difficulty ${level} emergency shield sequence must scale each of 100/75/50/25`);
}
if(model.getEmergencyShieldValues(5).some(Boolean))throw new Error('Emergency shield must be unavailable below difficulty 6');
for(let level=0;level<=10;level++){
  const tags=model.getDifficultyRuleTags(level);
  const details=model.getDifficultyRuleDetails(level);
  if(!tags.length||!details.includes('<li>'))throw new Error(`Difficulty ${level} must expose cumulative tags and expandable detail rows`);
  if(level>=6&&!tags.some(tag=>tag.includes('高难应急盾')))throw new Error(`Difficulty ${level} must retain the emergency shield tag`);
  if(level>=9&&!tags.some(tag=>tag.includes('难度9')))throw new Error(`Difficulty ${level} must retain prior and current level tags`);
}
console.log('Verified difficulty-scaled emergency shield values and cumulative difficulty rule tags/details.');
