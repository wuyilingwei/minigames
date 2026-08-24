import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { resolve } from 'node:path';

const root=resolve(new URL('..',import.meta.url).pathname);
const runtime=await readFile(resolve(root,'games/cassandri-legend/game.js'),'utf8');

for(const text of ['purchaseSlotUnlocked','function makeJobAmulet()','part:"accessory"','附赠职业护符','购买并领取'])if(!runtime.includes(text))throw new Error(`Purchased universal-slot gift contract is missing: ${text}`);
for(const obsolete of ['function buyPurchaseEquipment(','价格：1200 金币'])if(runtime.includes(obsolete))throw new Error(`Career amulet must not remain a separate purchase: ${obsolete}`);
if((runtime.match(/purchaseEquipment/g)||[]).length!==1||!runtime.includes('delete normalized.purchaseEquipment;'))throw new Error('The old separate-amulet field may only remain as a one-way save cleanup');

const saveStart=runtime.indexOf('function isRecord(');
const saveEnd=runtime.indexOf('\nfunction loadSave(',saveStart);
const saveContext={defaultPurchased:{egg:0,potion:0,boots:0,hat:0,doll:0},defaultSave:{eyeTotal:0,blood:0,pointAtk:0,pointHp:0,pointBj:0,pointBs:0,pointCrt:0,useBlood:0,gold:0,purchased:{egg:0,potion:0,boots:0,hat:0,doll:0},slot5Unlocked:false,purchaseSlotUnlocked:false,legacyAddonSlotUnlocked:false}};
vm.createContext(saveContext);vm.runInContext(runtime.slice(saveStart,saveEnd),saveContext);
const legacy=saveContext.normalizeSave({slot5Unlocked:true,useBlood:0,purchaseEquipment:{id:'jobAmulet'}});
if(!legacy.purchaseSlotUnlocked||!legacy.legacyAddonSlotUnlocked||'purchaseEquipment' in legacy)throw new Error('Old slot5 buyers must migrate to universal slot ownership and discard obsolete separate-amulet ownership');
const difficulty=saveContext.normalizeSave({slot5Unlocked:true,useBlood:6});
if(!difficulty.purchaseSlotUnlocked||!difficulty.legacyAddonSlotUnlocked)throw new Error('Every old slot5 save must retain both historical slot sources');

const slotStart=runtime.indexOf('const allEquipmentParts=');
const slotEnd=runtime.indexOf('\nfunction normalizeCombatant(',slotStart);
const slots={isRecord:value=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value),elements:['火','水','草','雷','无'],equipmentPartNames:{head:'头部',body:'身体',oneHand:'单手武器',twoHand:'双手武器',offHand:'副手',accessory:'配件',outerwear:'附加',purchase:'购买'},save:{slot5Unlocked:false,legacyAddonSlotUnlocked:false,useBlood:0,purchaseSlotUnlocked:true},player:{slots:[]}};
vm.createContext(slots);vm.runInContext(runtime.slice(slotStart,slotEnd),slots);
if(slots.inferEquipmentPart({name:'职业护符',part:'purchase'},5)!=='accessory')throw new Error('Legacy career amulets must migrate to the ordinary accessory part');
if(slots.getSlotCount()!==5||slots.getEquipmentSlots()[4].id!=='purchase'||slots.getEquipmentSlots()[4].name!=='装备 5'||slots.getEquipmentSlots()[4].accepts.length!==7)throw new Error('Purchased equipment 5 must be visually and mechanically universal');
slots.initSlots();
if(slots.player.slots.length!==5||slots.player.slots[4]?.id!=='jobAmulet'||slots.player.slots[4]?.part!=='accessory')throw new Error('An owned universal slot must gift the career amulet at the start of every new adventure');
slots.save={slot5Unlocked:false,legacyAddonSlotUnlocked:false,useBlood:6,purchaseSlotUnlocked:true};
slots.player.slots=[];slots.initSlots();
if(slots.player.slots.length!==6||slots.player.slots[4]?.id!=='emergencyShield'||slots.player.slots[5]?.id!=='jobAmulet')throw new Error('Difficulty and shop source positions must provide tactical shield and gifted career amulet respectively');
slots.player.slots[5]={name:'旅行斗篷',part:'outerwear',element:'无',atk:1,hp:2,bj:0,bs:0,crt:0,traits:[]};
slots.syncSlotCapacity();
if(slots.player.slots[5]?.name!=='旅行斗篷'||slots.player.slots.some(item=>item?.id==='jobAmulet'))throw new Error('Replacing the gifted amulet must persist during the current adventure');
const migratedShield=slots.normalizeEquipment({id:'emergencyShield',name:'高难应急护盾',part:'outerwear',element:'无'},4);
if(migratedShield.name!=='战术护盾'||migratedShield.part!=='accessory')throw new Error('Legacy emergency shield names must migrate to tactical shield as an ordinary accessory');

const jobStart=runtime.indexOf('function calcBaseStats(');
const jobEnd=runtime.indexOf('\nfunction applyEquipStats(',jobStart);
const job={save:{useBlood:0,pointAtk:0,pointHp:0,pointBj:0,pointBs:0,pointCrt:0,purchased:{egg:0,potion:0,boots:0,hat:0,doll:0}},player:{job:'战士',blessing:'战士的祝福',slots:[{id:'jobAmulet',part:'accessory'}]},jobData:{战士:{atk:220,hp:900,bj:.08,bs:1.5,crt:.03}},blessingData:{战士的祝福:{atk:60,hp:100,bj:0,bs:0,crt:0}}};
vm.createContext(job);vm.runInContext(runtime.slice(jobStart,jobEnd),job);
if(!job.hasJobAmulet())throw new Error('An equipped gifted amulet must enable the profession multiplier');
job.player.slots=[];
if(job.hasJobAmulet())throw new Error('A replaced amulet must stop applying its profession multiplier');
if(!runtime.includes('jobEffectMultiplier()'))throw new Error('Career effect multiplier is not wired to job-only effects');

const resetModel=runtime.match(/function resetShopPurchases\(\)\{[\s\S]*?\n\}/)?.[0];
if(!resetModel)throw new Error('Could not extract shop reset behavior');
const reset={defaultPurchased:{egg:0,potion:0,boots:0,hat:0,doll:0},save:{purchased:{egg:2},slot5Unlocked:true,purchaseSlotUnlocked:true,legacyAddonSlotUnlocked:true},player:{job:'',slots:[]},syncSlotCapacity(){},applyEquipStats(){},refreshStatPanel(){}};
vm.createContext(reset);vm.runInContext(resetModel,reset);reset.resetShopPurchases();
if(reset.save.purchaseSlotUnlocked||reset.save.legacyAddonSlotUnlocked||Object.values(reset.save.purchased).some(Boolean))throw new Error('Shop reset must clear purchased slot ownership and permanent items');

const giftSource=[runtime.match(/function makeJobAmulet\(\)\{[^\n]+/)?.[0],runtime.match(/function equipGiftedJobAmulet\(\)\{[\s\S]*?\n\}/)?.[0],runtime.match(/function buyPurchaseSlot\(\)\{[\s\S]*?\n\}/)?.[0]].join('\n');
if(!giftSource.includes('makeJobAmulet')||!giftSource.includes('equipGiftedJobAmulet')||!giftSource.includes('buyPurchaseSlot'))throw new Error('Could not extract slot purchase and gift behavior');
let purchase;
purchase={save:{purchaseSlotUnlocked:false,gold:6000},player:{job:'战士',slots:[null,null,null,null]},messages:[],getEquipmentSlots:()=>[{id:'gear1'},{id:'gear2'},{id:'gear3'},{id:'gear4'},{id:'purchase'}],syncSlotCapacity(){purchase.player.slots.length=5;purchase.player.slots[4]??=null;},applyEquipStats(){},refreshStatPanel(){},writeSave(){},autoSaveRun(){purchase.saved=true;},renderShop(message){purchase.messages.push(message);}};
vm.createContext(purchase);vm.runInContext(giftSource,purchase);purchase.buyPurchaseSlot();
if(!purchase.save.purchaseSlotUnlocked||purchase.save.gold!==1000||purchase.player.slots[4]?.id!=='jobAmulet'||!purchase.saved||!purchase.messages.some(message=>message.includes('赠送【职业护符】')))throw new Error('Buying the universal slot must immediately grant and equip the career amulet without a second purchase');

console.log('Verified universal purchased slot, bundled career amulet, legacy cleanup, replacement behavior, and job-only scope.');
