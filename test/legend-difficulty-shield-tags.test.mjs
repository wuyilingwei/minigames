import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(new URL('..',import.meta.url).pathname);
const html=await readFile(resolve(root,'games/cassandri-legend/index.html'),'utf8');
const runtime=await readFile(resolve(root,'games/cassandri-legend/game.js'),'utf8');
const start=runtime.indexOf('function getEmergencyShieldValueForCharges(');
const end=runtime.indexOf('\nfunction renderDifficultyPanel(',start);
if(start<0||end<0)throw new Error('Difficulty shield/tag helpers are not extractable');
const model=new Function('save',`${runtime.slice(start,end)}\nreturn {getEmergencyShieldValueForCharges,getEmergencyShieldValues,getHealingRecoveryRate,getHealingCapForMissing,getDifficultyRules,getDifficultyRuleTags,getDifficultyRuleDetails};`)({useBlood:0});

for(const level of [6,7,8,9,10]){
  const values=model.getEmergencyShieldValues(level);
  const expected=[100,75,50,25].map(base=>Math.floor(base*Math.pow(1.18,level)*1.25));
  if(JSON.stringify(values)!==JSON.stringify(expected))throw new Error(`Difficulty ${level} emergency shield sequence must preserve 100/75/50/25 decay with a 25% final-value increase`);
  const shieldRule=model.getDifficultyRules(level).find(rule=>rule.tag.includes('战术护盾'));
  if(!shieldRule?.detail.includes(`（${values.join('/')}临时盾，4次后损坏）`))throw new Error(`Difficulty ${level} tactical shield description must use the strengthened helper values`);
}
if(model.getEmergencyShieldValues(5).some(Boolean))throw new Error('Emergency shield must be unavailable below difficulty 6');
const healingRates=[1,1,1,.95,.90,.85,.75,.70,.65,.55,.50];
for(let level=0;level<=10;level++){
  if(model.getHealingRecoveryRate(level)!==healingRates[level])throw new Error(`Difficulty ${level} healing rate mismatch`);
  if(model.getHealingCapForMissing(900,level)!==Math.floor(900*healingRates[level]))throw new Error(`Difficulty ${level} missing-HP cap mismatch`);
}
for(let level=0;level<=10;level++){
  const tags=model.getDifficultyRuleTags(level);
  const details=model.getDifficultyRuleDetails(level);
  if(!tags.length||!details.includes('<li>'))throw new Error(`Difficulty ${level} must expose cumulative tags and expandable detail rows`);
  if(level>=6&&!tags.some(tag=>tag.includes('战术护盾')))throw new Error(`Difficulty ${level} must retain the tactical shield tag`);
  if(level>=9&&!tags.some(tag=>tag.includes('难度9')))throw new Error(`Difficulty ${level} must retain prior and current level tags`);
}
const maxTags=model.getDifficultyRuleTags(10);
for(const tag of ['难度3 · 回血 50%','难度3 · 装备等级 +','难度6 · 装备等级 ++','难度9 · 装备等级 +++'])if(!maxTags.includes(tag))throw new Error(`Difficulty 10 collapsed summary must retain ${tag}`);
if(!/<details class="difficulty-rules">/.test(html)||/<details class="difficulty-rules" open/.test(html))throw new Error('Difficulty rule bar must be a closed details element by default');
if(!runtime.includes('if(rules)rules.open=false'))throw new Error('Opening the difficulty overlay must reset the rule bar to collapsed');
console.log('Verified difficulty-scaled emergency shield values and cumulative difficulty rule tags/details.');
