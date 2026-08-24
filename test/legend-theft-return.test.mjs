import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(new URL('..',import.meta.url).pathname);
const runtime=await readFile(resolve(root,'games/cassandri-legend/game.js'),'utf8');
const helper=runtime.match(/function restoreStolenEquipment\(\){[\s\S]*?\n\}/)?.[0];
if(!helper)throw new Error('Could not extract the stolen-equipment restoration helper.');

const player={slots:[null,null,null],stolenEquipment:[{slotIndex:1,equipment:{name:'被偷走的剑'}},{slotIndex:2,equipment:{name:'被偷走的盾'}}]};
let statsApplied=0,panelsRefreshed=0,notice='';
const restore=new Function('player','applyEquipStats','refreshStatPanel','print',`${helper}\nreturn restoreStolenEquipment;`)(player,()=>{statsApplied++;},()=>{panelsRefreshed++;},message=>{notice=message;});
if(restore()!==2)throw new Error('Every item stolen during the battle must be returned.');
if(player.slots[1].name!=='被偷走的剑'||player.slots[2]?.name!=='被偷走的盾'||player.stolenEquipment.length!==0)throw new Error('Battle-end restoration must refill original slots and clear pending thefts.');
if(statsApplied!==1||panelsRefreshed!==1||!notice.includes('归还了 2 件装备'))throw new Error('Restoration must refresh combat stats and report the returned equipment count.');
if(restore()!==0||statsApplied!==1)throw new Error('Restoration must be idempotent after a battle ends.');

for(const [pattern,message] of [
  [/function tryEnemyTheft\(\)[\s\S]*player\.stolenEquipment\.push\(\{slotIndex:ridx,equipment:stolen\}\)/,'Theft must retain the original slot and equipment.'],
  [/function finishEnemyDefeat\(\)[\s\S]*restoreStolenEquipment\(\)/,'Victory must return stolen equipment.'],
  [/function onPlayerDefeat\(\)[\s\S]*restoreStolenEquipment\(\)/,'Defeat must return stolen equipment.'],
  [/你成功逃跑了！"\);restoreStolenEquipment\(\);gameState="badEnd"/,'Successful escape must return stolen equipment.'],
  [/normalized\.player\.stolenEquipment=Array\.isArray\(normalized\.player\.stolenEquipment\)/,'Resumable runs must retain pending thefts.'],
])if(!pattern.test(runtime))throw new Error(message);

console.log('Verified stolen equipment remains unavailable in combat and returns when the battle ends.');
