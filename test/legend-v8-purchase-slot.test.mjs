import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { resolve } from 'node:path';

const root=resolve(new URL('..',import.meta.url).pathname);
const runtime=await readFile(resolve(root,'games/cassandri-legend/game.js'),'utf8');

if(!runtime.includes('purchaseSlotUnlocked')||!runtime.includes('part:"purchase"')||!runtime.includes('购买槽'))throw new Error('Purchase-slot contracts are missing');
const saveStart=runtime.indexOf('function isRecord(');
const saveEnd=runtime.indexOf('\nfunction loadSave(',saveStart);
const saveContext={defaultPurchased:{egg:0,potion:0,boots:0,hat:0,doll:0},defaultSave:{eyeTotal:0,blood:0,pointAtk:0,pointHp:0,pointBj:0,pointBs:0,pointCrt:0,useBlood:0,gold:0,purchased:{egg:0,potion:0,boots:0,hat:0,doll:0},slot5Unlocked:false,purchaseSlotUnlocked:false,purchaseEquipment:null}};
vm.createContext(saveContext);vm.runInContext(runtime.slice(saveStart,saveEnd),saveContext);
const legacy=saveContext.normalizeSave({slot5Unlocked:true,useBlood:0});
if(!legacy.purchaseSlotUnlocked||!legacy.legacyAddonSlotUnlocked)throw new Error('Old slot5 buyer must migrate to purchaseSlotUnlocked and retain an add-on slot');
const difficulty=saveContext.normalizeSave({slot5Unlocked:true,useBlood:6});
if(!difficulty.purchaseSlotUnlocked||!difficulty.legacyAddonSlotUnlocked)throw new Error('Every old slot5 save must migrate both purchase ownership and legacy add-on compatibility');

const slotStart=runtime.indexOf('const equipmentSlots=');
const slotEnd=runtime.indexOf('\nfunction normalizeCombatant(',slotStart);
const slots={isRecord:value=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value),elements:['火','水','草','雷','无'],equipmentPartNames:{head:'头部',body:'身体',oneHand:'单手武器',twoHand:'双手武器',offHand:'副手',accessory:'饰品',outerwear:'附加',purchase:'购买'},save:{slot5Unlocked:false,legacyAddonSlotUnlocked:false,useBlood:0,purchaseSlotUnlocked:true},player:{slots:[null,null,null,null,null,null]}};
vm.createContext(slots);vm.runInContext(runtime.slice(slotStart,slotEnd),slots);
if(slots.inferEquipmentPart({name:'职业护符',part:'accessory'},5)!=='purchase')throw new Error('Career amulet must normalize to purchase part');
if(slots.getSlotCount()!==5||slots.getEquipmentSlots()[4].id!=='purchase')throw new Error('Low difficulty purchase-only mode must expose purchase as visible slot 5');
slots.save={slot5Unlocked:false,legacyAddonSlotUnlocked:false,useBlood:6,purchaseSlotUnlocked:false};
if(slots.getSlotCount()!==5||slots.getEquipmentSlots()[4].id!=='accessory')throw new Error('High difficulty add-on-only mode must expose add-on as visible slot 5');
slots.save={slot5Unlocked:false,legacyAddonSlotUnlocked:false,useBlood:6,purchaseSlotUnlocked:true};
if(slots.getSlotCount()!==6||slots.getEquipmentSlots()[4].id!=='accessory'||slots.getEquipmentSlots()[5].id!=='purchase')throw new Error('High difficulty plus purchase must expose add-on slot 5 and purchase slot 6');
slots.save.purchaseEquipment={id:'jobAmulet',name:'职业护符',element:'无',part:'purchase',atk:0,hp:0,bj:0,bs:0,crt:0,traits:[]};
slots.player.slots=[];
slots.initSlots();
if(slots.player.slots.length!==6||slots.player.slots[4]?.id!=='emergencyShield'||slots.player.slots[5]?.id!=='jobAmulet')throw new Error('A high-difficulty new run must start with the emergency shield in the add-on slot and the amulet in the purchase slot');
slots.save=legacy;
const migratedSlots=slots.normalizeEquipmentSlots([{name:'头盔',part:'head',element:'无'},{name:'铠甲',part:'body',element:'无'},{name:'长剑',part:'oneHand',element:'无'},{name:'盾牌',part:'offHand',element:'无'},{name:'披风',part:'outerwear',element:'无'}]);
if(migratedSlots.length!==6||migratedSlots[4]?.part!=='outerwear'||migratedSlots[5]!==null)throw new Error('Legacy slot5 save must retain its old add-on and expose an empty purchase slot');

const jobStart=runtime.indexOf('function calcBaseStats(');
const jobEnd=runtime.indexOf('\nfunction applyEquipStats(',jobStart);
const job={save:{purchaseEquipment:{id:'jobAmulet',part:'purchase'},useBlood:0,pointAtk:0,pointHp:0,pointBj:0,pointBs:0,pointCrt:0,purchased:{egg:0,potion:0,boots:0,hat:0,doll:0}},player:{job:'战士',blessing:'战士的祝福',slots:[{id:'jobAmulet',part:'purchase'}]},jobData:{战士:{atk:220,hp:900,bj:.08,bs:1.5,crt:.03}},blessingData:{战士的祝福:{atk:60,hp:100,bj:0,bs:0,crt:0}},hasJobAmulet:()=>true};
vm.createContext(job);vm.runInContext(runtime.slice(jobStart,jobEnd),job);
const base=job.calcBaseStats();
if(base.atk!==280||base.hp!==1000||Math.abs(base.bj-.08)>1e-9)throw new Error('Career amulet must not multiply base job stats');
if(!job.hasJobAmulet())throw new Error('An equipped career amulet must enable the profession multiplier');
job.player.slots=[];
if(job.hasJobAmulet())throw new Error('Owning an unequipped career amulet must not enable the profession multiplier');
if(!runtime.includes('jobEffectMultiplier()'))throw new Error('Career effect multiplier is not wired to job-only effects');

const resetModel=runtime.match(/function resetShopPurchases\(\)\{[\s\S]*?\n\}/)?.[0];
if(!resetModel)throw new Error('Could not extract shop reset behavior');
const reset={defaultPurchased:{egg:0,potion:0,boots:0,hat:0,doll:0},save:{purchased:{egg:2},slot5Unlocked:true,purchaseSlotUnlocked:true,legacyAddonSlotUnlocked:true,purchaseEquipment:{id:'jobAmulet'}},player:{job:'',slots:[]},syncSlotCapacity(){},applyEquipStats(){},refreshStatPanel(){}};
vm.createContext(reset);vm.runInContext(resetModel,reset);reset.resetShopPurchases();
if(reset.save.purchaseSlotUnlocked||reset.save.legacyAddonSlotUnlocked||reset.save.purchaseEquipment!==null||Object.values(reset.save.purchased).some(Boolean))throw new Error('Shop reset must clear purchase-slot ownership, purchase equipment, and permanent items');

const buyModel=runtime.match(/function buyPurchaseEquipment\(id,price\)\{[\s\S]*?\n\}/)?.[0];
if(!buyModel)throw new Error('Could not extract purchase-equipment behavior');
const cheatPurchase={save:{purchaseSlotUnlocked:true,purchaseEquipment:null,gold:0},cheatMode:true,player:{job:''},renderShop(){},writeSave(){},syncSlotCapacity(){},applyEquipStats(){},refreshStatPanel(){},autoSaveRun(){}};
vm.createContext(cheatPurchase);vm.runInContext(buyModel,cheatPurchase);cheatPurchase.buyPurchaseEquipment('jobAmulet',1200);
if(cheatPurchase.save.purchaseEquipment?.id!=='jobAmulet'||cheatPurchase.save.gold!==0)throw new Error('Cheat mode must allow free purchase-equipment verification without changing gold');

console.log('Verified independent purchase slot, legacy slot migration, purchase-only equipment, and job-only amulet scope.');
