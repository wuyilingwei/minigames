
const outputDom=document.getElementById("terminal");
const choicesDom=document.getElementById("choices");
const statContent=document.getElementById("statContent");

const defaultPurchased={egg:0,potion:0,boots:0,hat:0,doll:0};
const defaultSave={eyeTotal:0,blood:0,pointAtk:0,pointHp:0,pointBj:0,pointBs:0,pointCrt:0,useBlood:0,gold:0,purchased:defaultPurchased,slot5Unlocked:false};
let save={...defaultSave,purchased:{...defaultPurchased}};
let resetConfirmationPending=false;
let cheatMode=false,cheatBackup=null;
const CHEAT_SECRET="pqp是我们的皇";
let difficultyDraft=0;
function isRecord(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
function normalizeSave(stored){
    if(!isRecord(stored))return {...defaultSave,purchased:{...defaultPurchased}};
    let purchased=isRecord(stored.purchased)?stored.purchased:{};
    let normalized={...defaultSave,...stored,purchased:{...defaultPurchased,...purchased}};
    for(let key of ["eyeTotal","blood","pointAtk","pointHp","pointBj","pointBs","pointCrt","useBlood","gold"]){
        let value=Number(normalized[key]);
        normalized[key]=Number.isFinite(value)&&value>=0?Math.floor(value):defaultSave[key];
    }
    normalized.blood=Math.min(10,normalized.blood);
    normalized.useBlood=Math.min(10,normalized.useBlood);
    for(let key of Object.keys(defaultPurchased)){
        let value=Number(normalized.purchased[key]);
        normalized.purchased[key]=Number.isFinite(value)&&value>=0?Math.floor(value):defaultPurchased[key];
    }
    normalized.slot5Unlocked=Boolean(normalized.slot5Unlocked);
    return normalized;
}
function loadSave(){
    try{let raw=localStorage.getItem("kasandri6_save");save=raw?normalizeSave(JSON.parse(raw)):normalizeSave(null);}
    catch(e){save=normalizeSave(null);}
}
function writeSave(){localStorage.setItem("kasandri6_save",JSON.stringify(save));}
loadSave();
try{let backup=localStorage.getItem("kasandri6_cheat_backup");if(backup){cheatBackup=normalizeSave(JSON.parse(backup));cheatMode=true;}}catch(e){cheatBackup=null;cheatMode=false;}

const defaultPreferences={crt:true,reduceMotion:false,collapseEvents:true,tutorialSeen:false};
let preferences={...defaultPreferences};
function loadPreferences(){
    try{let raw=localStorage.getItem("kasandri6_preferences");let stored=raw?JSON.parse(raw):{};preferences={...defaultPreferences,...(isRecord(stored)?stored:{})};}
    catch(e){preferences={...defaultPreferences};}
    for(let key of Object.keys(defaultPreferences))preferences[key]=Boolean(preferences[key]);
    delete preferences.autoLootSelect;
}
function writePreferences(){localStorage.setItem("kasandri6_preferences",JSON.stringify(preferences));}
function applyPreferences(){
    let app=document.getElementById("app");
    if(app){app.classList.toggle("crt-on",preferences.crt);app.classList.toggle("reduce-motion",preferences.reduceMotion);}
}
loadPreferences();

let player={name:"",job:"",atk:0,hp:0,maxHp:0,bj:0,bs:0,crt:0,ZDYHP:0,shields:null,slots:[null,null,null,null],Q3:0,Q4:0,ZBSPECIALUSED1:0,ZBSPECIALUSED2:false,ZBSPECIALUSED3:false,nextDodgeBoost:false,canAdjustPoint:true,wave:0,blessAtkAdd:0,blessHpAdd:0,blessBjAdd:0,blessBsAdd:0,blessCrtAdd:0,energy:0,defendStack:0,permAtkAdd:0,permHpAdd:0,revengeActive:false,energySurgeBoost:false};
const equipmentSlots=[
    {id:"head",name:"头部",accepts:["head"]},{id:"body",name:"身体",accepts:["body"]},
    {id:"mainHand",name:"主手",accepts:["oneHand","twoHand"]},{id:"offHand",name:"副手",accepts:["oneHand","offHand"]},
    {id:"accessory",name:"附加",accepts:["accessory","outerwear"]}
];
const equipmentPartNames={head:"头部",body:"身体",oneHand:"单手武器",twoHand:"双手武器",offHand:"副手",accessory:"饰品",outerwear:"附加"};
function getSlotCount(){return save.slot5Unlocked||save.useBlood>=6?5:4;}
function getSlotLabel(index){return equipmentSlots[index]?equipmentSlots[index].name:`槽位${index+1}`;}
function inferEquipmentPart(item,index=0){
    let name=String(item&&item.name||"");
    // Older versions classified wearable add-ons as body or oneHand. Name-based
    // migration must run before trusting the persisted part so they can reach slot 5.
    if(/斗篷|披风|靴子|鞋子|手套|翅膀|背包|臂甲|胫甲|护腿|护肩|披肩|围巾/.test(name))return "outerwear";
    if(item&&equipmentPartNames[item.part])return item.part;
    if(/头盔|假发|面纱|帽子/.test(name))return "head";
    if(/铠甲|胸甲|战甲|布衣|毛衣|连衣裙|裤子/.test(name))return "body";
    if(/盾/.test(name))return "offHand";
    if(/大剑|巨锤|巨斧|长弓|弩|战戟|双刃剑/.test(name))return "twoHand";
    if(/戒指|项链|护符|腰带|念珠|水晶球|号角|香炉|钱包|钥匙/.test(name))return "accessory";
    return index===0?"head":index===1?"body":index===3?"offHand":"oneHand";
}
function normalizeEquipment(item,index=0){
    if(!isRecord(item))return null;
    let normalized={...item};
    normalized.part=inferEquipmentPart(normalized,index);
    normalized.element=elements.includes(normalized.element)?normalized.element:"无";
    for(let key of ["atk","hp","bj","bs","crt"]){let value=Number(normalized[key]);normalized[key]=Number.isFinite(value)?value:0;}
    if(normalized.trait&&!normalized.traits)normalized.traits=[normalized.trait];
    normalized.traits=Array.isArray(normalized.traits)?normalized.traits.filter(isRecord):[];
    delete normalized.trait;
    return normalized;
}
function normalizeEquipmentSlots(slots,slotCount=getSlotCount()){
    let next=Array.from({length:slotCount},()=>null);
    for(let sourceIndex=0;sourceIndex<(Array.isArray(slots)?slots.length:0);sourceIndex++){
        let item=normalizeEquipment(slots[sourceIndex],sourceIndex);
        if(!item)continue;
        let targetIndex=sourceIndex<next.length&&equipmentSlots[sourceIndex]?.accepts.includes(item.part)&&!next[sourceIndex]
            ?sourceIndex
            :next.findIndex((slot,index)=>!slot&&equipmentSlots[index]?.accepts.includes(item.part));
        if(targetIndex>=0)next[targetIndex]=item;
    }
    if(next[2]&&next[2].part==="twoHand")next[3]=null;
    if(next[3]&&next[3].part==="twoHand"){next[2]=null;next[3]=null;}
    return next;
}
function syncSlotCapacity(){player.slots=normalizeEquipmentSlots(player.slots);}
function makeStarterEquipment(){return [
    {name:"朴素头巾",element:"无",part:"head",atk:0,hp:0,bj:0,bs:0,crt:0,traits:[]},
    {name:"朴素布衣",element:"无",part:"body",atk:0,hp:0,bj:0,bs:0,crt:0,traits:[]},
    {name:"训练短剑",element:"无",part:"oneHand",atk:0,hp:0,bj:0,bs:0,crt:0,traits:[]},
    {name:"空白护臂",element:"无",part:"offHand",atk:0,hp:0,bj:0,bs:0,crt:0,traits:[]}
];}
function initSlots(){player.slots=normalizeEquipmentSlots(makeStarterEquipment());}
let enemy={name:"",atk:0,hp:0,maxHp:0,tracking:0,dodge:0,armor:0,hits:1,shields:null,traits:[],shield:0,dots:[],firstStrikeUsed:false,antiHealTurns:0,purifyTurns:0,purifyPenalty:0};
function normalizeCombatant(unit){
    if(!unit||typeof unit!=="object")return unit;
    let legacy=Math.max(0,Number(unit.ZDYHP??unit.shield)||0);
    let raw=unit.shields&&typeof unit.shields==="object"?unit.shields:{};
    unit.shields={hits:{charges:Math.max(0,Number(raw.hits?.charges)||0),value:Math.max(0,Number(raw.hits?.value)||0)},temp:Math.max(0,Number(raw.temp)||0),persistent:Math.max(0,Number(raw.persistent??legacy)||0)};
    unit.ZDYHP=unit.shields.temp+unit.shields.persistent;
    unit.shield=unit.ZDYHP;
    unit.tracking=Math.max(0,Number(unit.tracking)||0);
    unit.dodge=Math.max(0,Number(unit.dodge)||0);
    unit.armor=Math.max(0,Math.min(.8,Number(unit.armor)||0));
    unit.hits=Math.max(1,Math.floor(Number(unit.hits)||1));
    return unit;
}
function shieldTotal(unit){normalizeCombatant(unit);return unit.shields.hits.charges*unit.shields.hits.value+unit.shields.temp+unit.shields.persistent;}
function shieldSummary(unit){normalizeCombatant(unit);return `次数${unit.shields.hits.charges} · 临时${unit.shields.temp} · 持续${unit.shields.persistent}`;}
function grantShield(unit,type,value,charges=1){normalizeCombatant(unit);value=Math.max(0,Math.floor(value)||0);if(type==="hits"){unit.shields.hits.value=Math.max(unit.shields.hits.value,value);unit.shields.hits.charges+=Math.max(1,charges|0);}else unit.shields[type]=Math.max(0,unit.shields[type]+value);unit.ZDYHP=unit.shields.temp+unit.shields.persistent;unit.shield=unit.ZDYHP;}
function setTemporaryShield(unit,value){normalizeCombatant(unit);unit.shields.temp=Math.max(0,Math.floor(value)||0);unit.ZDYHP=unit.shields.temp+unit.shields.persistent;unit.shield=unit.ZDYHP;}
function restoreTemporaryShield(unit,value,cap){normalizeCombatant(unit);let before=unit.shields.temp,limit=Math.max(0,Math.floor(cap)||0);unit.shields.temp=Math.min(limit,before+Math.max(0,Math.floor(value)||0));unit.ZDYHP=unit.shields.temp+unit.shields.persistent;unit.shield=unit.ZDYHP;return unit.shields.temp-before;}
function absorbDamage(unit,amount,{pierce=false,label="护盾"}={}){normalizeCombatant(unit);let left=Math.max(0,Math.floor(amount)||0),absorbed=0;
    if(!pierce&&left>0&&unit.shields.hits.charges>0){let block=Math.min(left,unit.shields.hits.value);left-=block;absorbed+=block;unit.shields.hits.charges--;print(`【次数盾】${label}抵挡${block}点伤害（剩余${unit.shields.hits.charges}次）。`);}
    for(let type of ["temp","persistent"]){if(!pierce&&left>0&&unit.shields[type]>0){let block=Math.min(left,unit.shields[type]);unit.shields[type]-=block;left-=block;absorbed+=block;print(`【${type==="temp"?"临时盾":"持续盾"}】${label}吸收${block}点伤害。`);}}
    unit.ZDYHP=unit.shields.temp+unit.shields.persistent;unit.shield=unit.ZDYHP;return {damage:left,absorbed};
}
function healPlayer(amount,source="恢复"){
    let requested=Math.max(0,Math.floor(amount)||0), bonus=hasPrismaticResonance()?1.20:1;
    let perHealCap=player.maxHp;
    if(save.useBlood>=3)perHealCap=Math.floor(player.maxHp*Math.max(.30,.60-(save.useBlood-3)*.02));
    let healed=Math.max(0,Math.min(Math.floor(requested*bonus),perHealCap,player.maxHp-player.hp));player.hp+=healed;
    print(`【${source}】回复${healed}/${requested}点生命${save.useBlood>=3?`（本次上限${perHealCap}）`:""}。`);return healed;
}
function hasPrismaticResonance(){let c=getElemCount();return ["火","水","草","雷"].every(element=>c[element]>=1);}
function prepareBattleShields(){
    normalizeCombatant(player);
    setTemporaryShield(player,0);
    if(hasPrismaticResonance()){
        let shield=Math.max(1,Math.floor(player.maxHp*.08));
        setTemporaryShield(player,shield);
        print(`【四色共鸣】进战获得${shield}点自然临时盾。`);
    }
}
let gameState="start";
let pendingLoot=null;
let lastEquipAction=null;
let autoBattle=false;
let autoBattleTimer=null;
let gamePaused=false;
let lootDeferred=false;
let lootAutoSelectTimer=null;
let lootAutoSelectToken=0;
let lootAutoSelectRemaining=0;
let lootAutoSelectEnabled=false;
let autoBattleBeforeSettings=false;
let bannedJob=null,bannedBless=null;
let lastBattleSnapshot=null;
let defeatAnimating=false;

const runSaveSlots=["auto","1","2","3"];
const SAVE_ARCHIVE_KIND="cassandri-legend-save";
const SAVE_ARCHIVE_VERSION=1;
const SAVE_ARCHIVE_MAX_BYTES=2*1024*1024;
let pendingSaveImport=null;
function runSaveKey(slot){return `kasandri6_run_${slot}`;}
function cloneForStorage(value){return JSON.parse(JSON.stringify(value));}
function isSupportedRunState(state){return ["battle","bossBattle","loot","bossLoot","equipLostConfirm","bossKnockoff"].includes(state);}
function snapshotRun(){
    if(!isSupportedRunState(gameState)||!player.job||!player.blessing)return null;
    return {version:2,savedAt:Date.now(),state:gameState,save:cloneForStorage(save),player:cloneForStorage(player),enemy:cloneForStorage(enemy),pendingLoot:cloneForStorage(pendingLoot),lootDeferred,bannedJob,bannedBless,lastBattleSnapshot:cloneForStorage(lastBattleSnapshot)};
}
function validateRunSnapshot(snapshot){
    if(!isRecord(snapshot)||![1,2].includes(snapshot.version)||!isSupportedRunState(snapshot.state)||!isRecord(snapshot.player)||!isRecord(snapshot.enemy)||!snapshot.player.job||!snapshot.player.blessing)return null;
    if((snapshot.state==="loot"||snapshot.state==="bossLoot")&&(!isRecord(snapshot.pendingLoot)||!isRecord(snapshot.pendingLoot.e1)||!isRecord(snapshot.pendingLoot.e2)))return null;
    let normalized=cloneForStorage(snapshot);
    normalized.version=2;
    normalized.player.defendStack=Math.min(2,Math.max(0,Number(normalized.player.defendStack)||(normalized.player.nextDefendBoost?1:0)));
    normalized.player.revengeActive=Boolean(normalized.player.revengeActive);
    normalized.player.energySurgeBoost=Boolean(normalized.player.energySurgeBoost);
    normalizeCombatant(normalized.player);
    normalizeCombatant(normalized.enemy);
    let snapshotSave=normalizeSave(normalized.save);
    let slotCount=snapshotSave.slot5Unlocked||snapshotSave.useBlood>=6?5:4;
    normalized.player.slots=normalizeEquipmentSlots(normalized.player.slots,slotCount);
    if(normalized.pendingLoot){for(let key of ["e1","e2"])normalized.pendingLoot[key]=normalizeEquipment(normalized.pendingLoot[key]);}
    return normalized;
}
function readRunSave(slot){
    try{let raw=localStorage.getItem(runSaveKey(slot));return raw?validateRunSnapshot(JSON.parse(raw)):null;}
    catch(e){return null;}
}
function writeRunSave(slot){
    let snapshot=snapshotRun();
    if(!snapshot)return {ok:false,message:"请进入战斗或战利品选择后再保存。"};
    localStorage.setItem(runSaveKey(slot),JSON.stringify(snapshot));
    return {ok:true,message:slot==="auto"?"自动存档已更新。":"手动存档已写入。"};
}
function clearRunSave(slot){if(typeof localStorage.removeItem==="function")localStorage.removeItem(runSaveKey(slot));}
function buildSaveArchive(){
    let runs={};
    for(let slot of runSaveSlots)runs[slot]=readRunSave(slot);
    return {kind:SAVE_ARCHIVE_KIND,formatVersion:SAVE_ARCHIVE_VERSION,gameVersion:"8.0",exportedAt:new Date().toISOString(),save:cloneForStorage(normalizeSave(save)),runs};
}
function validateSaveArchive(archive){
    if(!isRecord(archive)||archive.kind!==SAVE_ARCHIVE_KIND)throw new Error("这不是《卡桑德里传说》的存档文件。");
    if(archive.formatVersion!==SAVE_ARCHIVE_VERSION)throw new Error("存档文件版本不受支持。");
    if(!isRecord(archive.save)||!isRecord(archive.runs))throw new Error("存档文件缺少必要数据。");
    let normalized={kind:SAVE_ARCHIVE_KIND,formatVersion:SAVE_ARCHIVE_VERSION,gameVersion:String(archive.gameVersion||"未知"),exportedAt:archive.exportedAt,save:normalizeSave(archive.save),runs:{}};
    for(let slot of runSaveSlots){
        if(!Object.prototype.hasOwnProperty.call(archive.runs,slot))throw new Error("存档文件缺少自动档或手动槽。");
        if(archive.runs[slot]===null){normalized.runs[slot]=null;continue;}
        let snapshot=validateRunSnapshot(archive.runs[slot]);
        if(!snapshot)throw new Error(`存档槽 ${slot==="auto"?"自动":slot} 的数据无效。`);
        normalized.runs[slot]=snapshot;
    }
    return normalized;
}
function exportSaveArchive(){
    let archive=buildSaveArchive();
    let blob=new Blob([JSON.stringify(archive,null,2)],{type:"application/json"});
    let url=URL.createObjectURL(blob),link=document.createElement("a");
    link.href=url;
    link.download=`cassandri-legend-save-${archive.exportedAt.slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),0);
    showSaveTransferNotice("完整存档已导出。请妥善保存下载的 JSON 文件。");
}
function showSaveTransferNotice(message,isError=false){
    let notice=document.getElementById("saveTransferNotice");
    notice.textContent=message;
    notice.classList.toggle("is-error",isError);
}
function cancelPendingSaveImport(){
    pendingSaveImport=null;
    let confirm=document.getElementById("saveImportConfirm"),input=document.getElementById("saveImportInput");
    if(confirm)confirm.hidden=true;
    if(input)input.value="";
}
async function stageSaveImport(file){
    cancelPendingSaveImport();
    if(!file)return;
    if(file.size>SAVE_ARCHIVE_MAX_BYTES){showSaveTransferNotice("存档文件超过 2 MB，已拒绝导入。",true);return;}
    try{
        let archive=validateSaveArchive(JSON.parse(await file.text()));
        pendingSaveImport=archive;
        let count=runSaveSlots.filter(slot=>archive.runs[slot]).length;
        let exportedAt=formatSavedAt(archive.exportedAt);
        document.getElementById("saveImportSummary").textContent=`已读取 ${archive.gameVersion} 存档：永久成长、${count} 个续玩槽，导出时间 ${exportedAt}。确认后会覆盖当前全部存档并重新载入游戏。`;
        document.getElementById("saveImportConfirm").hidden=false;
        showSaveTransferNotice("文件校验通过，请确认是否覆盖当前存档。");
    }catch(error){
        showSaveTransferNotice(error instanceof Error?error.message:"无法读取这个存档文件。",true);
    }
}
function writeImportedSaveArchive(archive){
    let values={"kasandri6_save":JSON.stringify(archive.save)};
    for(let slot of runSaveSlots)values[runSaveKey(slot)]=archive.runs[slot]?JSON.stringify(archive.runs[slot]):null;
    let previous={};
    for(let key of Object.keys(values))previous[key]=localStorage.getItem(key);
    try{
        for(let [key,value] of Object.entries(values)){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}
    }catch(error){
        for(let [key,value] of Object.entries(previous)){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}
        throw error;
    }
}
function confirmSaveImport(){
    if(!pendingSaveImport)return;
    try{
        writeImportedSaveArchive(pendingSaveImport);
        save=normalizeSave(pendingSaveImport.save);
        pendingSaveImport=null;
        document.getElementById("saveImportConfirm").hidden=true;
        showSaveTransferNotice("导入成功，正在重新载入游戏……");
        setTimeout(()=>location.reload(),300);
    }catch(error){
        showSaveTransferNotice("导入失败，原有存档未被更改。",true);
    }
}
function autoSaveRun(){writeRunSave("auto");}
function restoreRunSnapshot(snapshot){
    let valid=validateRunSnapshot(snapshot);
    if(!valid)return false;
    save=normalizeSave(valid.save);
    player=cloneForStorage(valid.player);
    player.slots=normalizeEquipmentSlots(player.slots);
    enemy=cloneForStorage(valid.enemy);
    gameState=valid.state;
    pendingLoot=cloneForStorage(valid.pendingLoot);
    lootDeferred=Boolean(valid.lootDeferred);
    bannedJob=valid.bannedJob||null;
    bannedBless=valid.bannedBless||null;
    lastBattleSnapshot=valid.lastBattleSnapshot||null;
    lastEquipAction=null;
    gamePaused=false;
    writeSave();
    hideGameOverlays();
    outputDom.innerHTML="";
    print(`已恢复 ${gameState==="loot"||gameState==="bossLoot"?"战利品选择":"战斗进度"}。`);
    refreshStatPanel();
    if((gameState==="loot"||gameState==="bossLoot")&&!lootDeferred)showLootChoice(pendingLoot.e1,pendingLoot.e2,pendingLoot.source);
    else if(gameState==="equipLostConfirm")resumeEquipLossConfirmation();
    else if(gameState==="bossKnockoff")resumeBossKnockoffConfirmation();
    else battleLoop();
    return true;
}

const jobData={
"战士":{atk:220,hp:900,bj:0.08,bs:1.5,crt:0.03,desc:"高攻击，攻击吸血20%，战胜加攻击"},
"天使":{atk:130,hp:1450,bj:0.08,bs:1.5,crt:0.05,desc:"高血量，血量增伤，战胜加血量"},
"勇者":{atk:180,hp:1100,bj:0.28,bs:2.2,crt:0.05,desc:"高暴击，受击反伤15%"},
"隐士":{atk:190,hp:900,bj:0.10,bs:1.6,crt:0.35,desc:"高闪避，溢出闪避增伤，战胜加闪避"}
};

const blessingData={
"战士的祝福":{atk:60,hp:100,bj:0,bs:0,crt:0,desc:"攻击+60血量+100，战胜攻击+5%，攻击回血3%"},
"天使的祝福":{atk:20,hp:400,bj:0,bs:0,crt:0,desc:"血量+400攻击+20，满血增伤25%，战胜血量+5%"},
"勇者的祝福":{atk:-30,hp:0,bj:0.20,bs:0.4,crt:0,desc:"暴击+20%爆伤+40%攻击-30，溢出暴击转护盾，战胜暴击+3%爆伤+5%"},
"隐士的祝福":{atk:0,hp:0,bj:-0.05,bs:-0.2,crt:0.30,desc:"闪避+30%暴击-5%爆伤-20%，溢出闪避转增伤，战胜闪避+3%"}
};

const monsterAdj=["凶猛的","狡猾的","嗜血的","狂暴的","阴暗的","腐朽的","狰狞的","咆哮的","巨型的","毒液的","烈焰的","寒冰的","暗影的","亡灵的","恶魔的","蛮荒的","深渊的","噩梦的","绝望的","快乐的","无语的","痴呆的","游荡的","成群的","路过的","帅气的","喝水的","发光的","癫狂的","丑陋的","散发香味的","散发臭气的","刻薄的","自大的","年老的","年幼的","会飞的","长翅膀的","胆小的","自卑的","写歌的","画画的","听虚拟歌姬的","试图逃跑的","讲笑话的","唱歌的","跳舞的","咬打火机的","玩游戏的","死翘翘的","尖叫的","状况外的","不想活了的","玩手指的","咬指甲的","打电动的","打音游的","悲鸣的","蠕动的","患有精神病的","好胜的","因为怕死就全点血量的","寂寞的","参悟人生的","立地成佛的","学猫叫的","愚蠢的","无聊的","只是来打着玩玩的","尿急的","正在吃饭的","多愁善感的","锈蚀的","冒烟的","覆满苔藓的","骨甲包裹的","吐毒沫的","浑身溃烂的","被诅咒的","星光笼罩的","暴怒的","昏昏欲睡的","幻视的","狂躁的","流亡的","洞穴栖息的","沼泽潜伏的","熔岩蛰伏的","雾中徘徊的"];
const monsterNoun=["哥布林","狼人","骷髅兵","史莱姆","蝙蝠","蜘蛛","食人魔","僵尸","幽灵","巨魔","石像鬼","九头蛇","奇美拉","蝎尾狮","地狱犬","巫医","死灵法师","暗影刺客","蛮荒战士","深渊领主","巨人","宝箱怪","矮人","兽人","精灵","拾荒者","不可名状物","吸血鬼","鬼怪","植物","人","眼镜蛇","大甲虫","狼","狐狸","猫","狗","老鼠","蜈蚣","蟒蛇","独角兽","外星人","妖精","魅魔","恶魔","梦魇","邪灵","三脚鸡","亡灵","树人","海妖","半人马","熔岩元素","冰霜元素","阴影","巨章鱼","骨龙","腐狼","泥浆怪","鸦人","石傀儡","飞虫群"];
const lootAdj=["锋利的","坚固的","华丽的","古老的","神秘的","闪耀的","诅咒的","圣光的","龙鳞的","暗影的","烈焰的","寒冰的","雷霆的","剧毒的","嗜血的","不朽的","传说的","史诗的","远古的","神圣的","闪亮的","坚硬的","破损的","有污渍的","光滑的","明亮的","弯曲的","简朴的","粗糙的","丑陋的","独一无二的","尖锐的","珍贵的","遗失的","会飞的","长翅膀的","普通的","环保的","纸扎的","可食用的","冰冷的","烫手的","没用的","金灿灿的","需要充电的","沉重的","轻盈的","会尖叫的","哭泣的","充满好奇心的","白色的","黑色的","有毒的","沾着血的","奇妙的","一般的","绿色的","蓝色的","紫色的","红色的","干净的","漂亮的","整洁的","古怪的","银色的","金色的","奇葩的","脆弱的","柔软的","寒冷的","沉甸甸的","炙热的","滚烫的","散发着诡异光芒的","破烂的","吹口哨的","吐舌头的","变成猴子的","锈蚀的","星陨的","亡灵浸染的","妖精锻造的","熔岩浇筑的","月光祝福的","梦境的","砂砾覆盖的","雷霆轰鸣的","腐臭的","半融化的","泡沫编织的","暗影缠绕的","苔藓密布的","冰晶凝结的","混沌的","流光溢彩的","萤火萦绕的"];
const lootNoun=["长剑","战斧","巨锤","匕首","法杖","盾牌","铠甲","头盔","靴子","戒指","项链","护符","披风","手套","腰带","长弓","弩","长矛","双刃剑","权杖","宝剑","大剑","剑","盾","矛","弓","针","小刀","刀","长刀","短刀","锁链","锤子","翅膀","水杯","镰刀","破烂","冰箱","洗衣机","鞋子","裤子","手机","充电宝","假发","假牙","背包","钥匙","钱包","塑料袋","饭卡","毛衣","连衣裙","盒子","毛巾","纸","战戟","斗篷","臂甲","胫甲","念珠","骨刃","巨斧","飞镖","号角","香炉","水晶球","石锤","骨盾","面纱"];

const traitList=[
{id:"reviveOnce",name:"不死意志",desc:"被杀死时满血复活，仅生效一次",prob:1},
{id:"revive30",name:"苟延残喘",desc:"被杀死时30%概率保留1血，可多次生效",prob:1},
{id:"deadlyStrike",name:"致命一击",desc:"攻击-50%，但5%概率直接秒杀敌人",prob:1},
{id:"crit20x",name:"会心一击",desc:"攻击-30%，但20%概率造成20倍伤害",prob:1},
{id:"critHeal",name:"吸血暴击",desc:"暴击时回复10%生命值",prob:1},
{id:"attackHeal",name:"生命汲取",desc:"攻击时回复3%生命值",prob:1},
{id:"dodgeBoost",name:"闪避反击",desc:"闪避后下次攻击伤害变为10倍",prob:1},
{id:"berserk",name:"狂暴之力",desc:"血量低于30%时攻击力提升50%",prob:1},
{id:"ironWall",name:"铁壁守护",desc:"受到的所有伤害降低15%",prob:1},
{id:"critEnergy",name:"暴击充能",desc:"暴击时额外获得10点能量",prob:1},
{id:"execute",name:"斩杀",desc:"敌人血量低于20%时造成的伤害翻倍",prob:1},
{id:"dodgeHeal",name:"灵动自愈",desc:"闪避时回复5%最大生命值",prob:1},
{id:"thorns",name:"荆棘反伤",desc:"被攻击时反弹10%伤害给敌人",prob:1},
{id:"shieldGain",name:"护盾之核",desc:"装备后获得跨战斗保留的持续盾",prob:1},
{id:"burn",name:"烈焰灼烧",desc:"攻击时使敌人灼烧，每回合受到攻击力20%伤害，持续3回合",prob:1},
{id:"poison",name:"剧毒腐蚀",desc:"攻击时使敌人中毒，每回合损失最大血量3%，持续3回合",prob:1},
{id:"bleed",name:"撕裂流血",desc:"攻击时使敌人流血，每回合损失当前血量5%，持续3回合",prob:1},
{id:"critShield",name:"暴击护盾",desc:"暴击时获得最大血量5%的临时盾",prob:1},
{id:"killHeal",name:"斩杀回复",desc:"击杀敌人时回复30%最大生命值",prob:1},
{id:"firstStrike",name:"先发制人",desc:"每场战斗首次攻击伤害翻倍",prob:1},
{id:"highHpBoost",name:"全盛之势",desc:"血量高于80%时攻击力提升30%",prob:1},
{id:"energySurge",name:"能量涌动",desc:"每次攻击额外获得8点能量，能量满时下次攻击伤害提升10%",prob:1},
{id:"lifesteal",name:"生命汲取·强",desc:"攻击时回复造成伤害的10%生命值",prob:1},
{id:"doubleStrike",name:"连击",desc:"攻击时有20%概率额外攻击一次",prob:1},
{id:"armorBreak",name:"破甲",desc:"攻击伤害提升10%，对重甲敌人额外造成20%伤害",prob:1},
{id:"purify",name:"净化",desc:"攻击时有50%概率降低敌人15%攻击力，持续2回合",prob:1},
{id:"antiHeal",name:"禁疗",desc:"攻击伤害提升5%，并使敌人2回合无法回复生命",prob:1},
{id:"trueStrike",name:"必中打击",desc:"攻击无视敌人闪避，伤害提升8%",prob:1},
{id:"antiThorns",name:"反刺护体",desc:"免疫敌人荆棘反伤，受到伤害降低5%",prob:1},
{id:"stealGuard",name:"防盗",desc:"免疫小偷偷窃装备，开局获得最大生命5%护盾",prob:1},
{id:"dotResist",name:"抗毒",desc:"持续伤害降低50%，受到伤害降低5%",prob:1},
{id:"critExecute",name:"暴击斩杀",desc:"暴击时若敌人生命低于30%则直接斩杀",prob:1},
{id:"energyShield",name:"能量护盾",desc:"能量满时获得最大生命20%的临时盾",prob:1},
{id:"revenge",name:"复仇",desc:"受到攻击后下次攻击伤害提升30%",prob:1},
{id:"shieldBash",name:"护盾猛击",desc:"拥有护盾时攻击伤害提升25%",prob:1},
{id:"secondWind",name:"背水一战",desc:"生命低于20%时闪避率提升30%",prob:1}
];
const equipmentTraitIdsByTier={
    1:["attackHeal","dodgeBoost","berserk","ironWall","execute","critShield","firstStrike","highHpBoost"],
    2:["critHeal","critEnergy","dodgeHeal","thorns","shieldGain","burn","poison","bleed","killHeal","energySurge","lifesteal","doubleStrike","armorBreak","purify","antiHeal","trueStrike","antiThorns","dotResist"],
    3:["reviveOnce","revive30","deadlyStrike","crit20x","critExecute","energyShield","revenge","shieldBash","secondWind","stealGuard"]
};
function getEquipmentTraitPool(tier){let ids=new Set();for(let level=1;level<=tier;level++)for(let id of equipmentTraitIdsByTier[level]||[])ids.add(id);return traitList.filter(trait=>ids.has(trait.id));}

const elements=["火","水","草","雷"];
function elemClass(e){return e==="火"?"elem-fire":e==="水"?"elem-water":e==="草"?"elem-grass":e==="雷"?"elem-thunder":"elem-none";}

const enemyTraitList=[
{id:"dot",name:"剧毒之体",desc:"攻击附加无法闪避的持续伤害"},
{id:"thief",name:"小偷",desc:"战斗中有概率偷走一件装备"},
{id:"heal",name:"再生",desc:"每次攻击后回复5%最大生命值"},
{id:"berserker",name:"战狂",desc:"攻击有概率连击，连击时损失10%生命"},
{id:"pierce",name:"隔山打牛",desc:"攻击无视护盾（可被闪避）"},
{id:"armor",name:"重甲",desc:"护甲至少提高至30%"},
{id:"thorns",name:"荆棘之甲",desc:"被攻击时反弹15%伤害"},
{id:"lifesteal",name:"嗜血",desc:"攻击时回复造成伤害20%的生命值"},
{id:"rage",name:"狂暴",desc:"血量低于50%时攻击力提升50%"},
{id:"dodge",name:"灵巧",desc:"闪避率至少提高至20%"},
{id:"crit",name:"致命",desc:"攻击有25%概率造成1.5倍伤害"},
{id:"trueSight",name:"真实之眼",desc:"攻击完全无视闪避（必中）"},
{id:"phase",name:"相位",desc:"攻击有50%概率无视闪避"},
{id:"weaken",name:"虚弱",desc:"攻击命中后降低玩家3-5%攻击力"},
{id:"curse",name:"诅咒",desc:"攻击命中后降低玩家1-3%暴击率"},
{id:"enrage",name:"激怒",desc:"每次被攻击后攻击力提升10%"},
{id:"explode",name:"爆裂",desc:"死亡时对玩家造成最大血量10%的伤害"},
{id:"shield",name:"护盾",desc:"开局自带最大血量20%的护盾"}
];
function hasETrait(id){return enemy.traits&&enemy.traits.some(t=>t.id===id);}
function getETraitNames(){return enemy.traits&&enemy.traits.length>0?enemy.traits.map(t=>t.name).join("·"):"";}

function print(s,cls="",raw=false){
    let html;
    if(raw){html=String(s).replace(/\n/g,"<br>");}
    else{let escaped=String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");html=escaped.replace(/\n/g,"<br>");}
    outputDom.innerHTML+=`<div class="line ${cls}">${html}</div>`;
    outputDom.scrollTop=outputDom.scrollHeight;
}

function escapeHtml(value){return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function svgUse(name,className="hud-svg"){return `<svg class="${className}" aria-hidden="true"><use href="#svg-${name}"></use></svg>`;}
function printEventSummary(title,detail){
    outputDom.innerHTML+=`<details class="terminal-event" open><summary>${escapeHtml(title)}</summary><div class="event-detail">${escapeHtml(detail)}</div></details>`;
    outputDom.scrollTop=outputDom.scrollHeight;
}
function collapseTerminalEvents(){
    if(!preferences.collapseEvents||typeof document.querySelectorAll!=="function")return;
    for(let event of document.querySelectorAll("#terminal .terminal-event[open]"))event.open=false;
}
function hideGameOverlays(){
    cancelLootAutoSelect();
    for(let id of ["welcomeOverlay","settingsOverlay","changelogOverlay","shopOverlay","saveOverlay","lootOverlay","setOverlay"]){
        let overlay=document.getElementById(id);
        if(overlay)overlay.hidden=true;
    }
    gamePaused=false;
}

function clearChoices(){choicesDom.innerHTML="";}
function addChoice(text,callback,cls=""){
    let b=document.createElement("button");
    b.className="choice-btn "+cls;
    b.textContent=text;
    b.onclick=callback;
    choicesDom.appendChild(b);
}

function rand(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}

function getElemCount(){
    let count={火:0,水:0,草:0,雷:0};
    for(let s of player.slots){if(s&&Object.prototype.hasOwnProperty.call(count,s.element))count[s.element]++;}
    return count;
}
function getSetBonus(){
    let c=getElemCount();
    let active=[];
    for(let e of elements){
        if(c[e]>=4)active.push(e+"4");
        else if(c[e]>=2)active.push(e+"2");
    }
    return active;
}
function hasSet(tag){return getSetBonus().indexOf(tag)>=0;}
function hasPrismaticResonanceFor(slots){let count={火:0,水:0,草:0,雷:0};for(let slot of slots||[]){if(slot&&Object.prototype.hasOwnProperty.call(count,slot.element))count[slot.element]++;}return Object.values(count).every(value=>value>=1);}
function elementSetScale(slots=player.slots){return hasPrismaticResonanceFor(slots)?1.5:1;}
function scaledElementEffect(value,slots=player.slots){return value*elementSetScale(slots);}

function getTraitMult(){
    let atkMult=1;
    for(let s of player.slots){
        if(s&&s.traits){
            for(let trait of s.traits){
                if(trait.id==="deadlyStrike")atkMult*=0.5;
                if(trait.id==="crit20x")atkMult*=0.7;
            }
        }
    }
    return atkMult;
}

function hasTrait(id){
    for(let s of player.slots){if(s&&s.traits&&s.traits.some(trait=>trait.id===id))return true;}
    return false;
}
function countTrait(id){
    let c=0;
    for(let s of player.slots){if(s&&s.traits){for(let trait of s.traits){if(trait.id===id)c++;}}}
    return c;
}
function getArmorBreakValue(){return Math.min(.80,player.slots.flatMap(slot=>slot?.traits||[]).filter(trait=>trait.id==="armorBreak").reduce((sum,trait)=>sum+(Number(trait.value)||.10),0));}

function getTraitProbMult(){
    if(hasSet("草4"))return scaledElementEffect(2.5);
    if(hasSet("草2"))return scaledElementEffect(1.5);
    return 1;
}

function getSetBonusFor(slots){
    let count={火:0,水:0,草:0,雷:0};
    for(let slot of slots){if(slot&&Object.prototype.hasOwnProperty.call(count,slot.element))count[slot.element]++;}
    return elements.flatMap(element=>count[element]>=4?[element+"4"]:count[element]>=2?[element+"2"]:[]);
}
function countTraitFor(slots,id){let count=0;for(let slot of slots){if(slot&&slot.traits){for(let trait of slot.traits){if(trait.id===id)count++;}}}return count;}
function getTraitMultFor(slots){return Math.pow(0.5,countTraitFor(slots,"deadlyStrike"))*Math.pow(0.7,countTraitFor(slots,"crit20x"));}
function getTraitProbMultFor(slots){
    let sets=getSetBonusFor(slots);
    return sets.includes("草4")?scaledElementEffect(2.5,slots):sets.includes("草2")?scaledElementEffect(1.5,slots):1;
}
function getExpectedCrit20xMultFor(slots){
    let count=countTraitFor(slots,"crit20x");
    let chance=Math.min(1,0.20*count*getTraitProbMultFor(slots));
    return 1+19*chance;
}
function getNextEnemyForecast(){
    let diffMult=Math.pow(1.4,save.useBlood||0);
    let nextWave=Math.max(1,(player.wave||0)+1);
    let bossPending=gameState==="bossLoot"||(gameState==="loot"&&player.wave>=20);
    if(bossPending){
        let isIt=player.Q3>=3;
        let baseAtk=isIt?3000:2000,baseHp=isIt?300000:200000;
        return {name:isIt?"它":"魔王",label:`下一场 Boss · ${isIt?"它":"魔王"}`,atk:Math.floor(baseAtk*diffMult),maxHp:Math.floor(baseHp*diffMult),tracking:isIt?0.18:0.12,dodge:isIt?0.12:0.08,armor:isIt?0.25:0.18,hits:isIt?4:3,traits:[]};
    }
    let baseAtk=50+nextWave*15,baseHp=300+nextWave*80;
    if(nextWave>=7){
        if(player.job==="战士")baseHp*=5;
        else if(player.job==="勇者")baseHp*=4;
    }
    return {name:`第 ${nextWave} 波敌人`,label:`下一场 · 第 ${nextWave} 波`,atk:Math.floor(baseAtk*diffMult),maxHp:Math.floor(baseHp*diffMult),tracking:Math.min(.30,.03+nextWave*.012+(save.useBlood||0)*.008),dodge:Math.min(.28,.02+nextWave*.008),armor:Math.min(.35,.04+nextWave*.012),hits:nextWave>=8?3:nextWave>=4?2:1,traits:[]};
}
function getComparisonTarget(){return getNextEnemyForecast();}
function targetHasTrait(target,id){return target&&Array.isArray(target.traits)&&target.traits.some(trait=>trait.id===id);}
function deriveBuild(slots){
    let base=calcBaseStats();
    let atk=base.atk,hp=base.hp,bj=base.bj,bs=base.bs,crt=base.crt;
    for(let slot of slots){if(slot){atk+=slot.atk;hp+=slot.hp;bj+=slot.bj;bs+=slot.bs;crt+=slot.crt;}}
    atk=Math.floor(atk*getTraitMultFor(slots))+(player.blessAtkAdd||0)+(player.permAtkAdd||0);
    hp+=((player.blessHpAdd||0)+(player.permHpAdd||0));
    bj+=(player.blessBjAdd||0);bs+=(player.blessBsAdd||0);crt+=(player.blessCrtAdd||0);
    let sets=getSetBonusFor(slots);
    let fireMult=sets.includes("火4")?1+scaledElementEffect(0.25,slots):sets.includes("火2")?1+scaledElementEffect(0.10,slots):1;
    let thunderRate=sets.includes("雷4")?scaledElementEffect(0.06,slots):sets.includes("雷2")?scaledElementEffect(0.03,slots):0;
    let waterMult=sets.includes("水4")?1-scaledElementEffect(0.20,slots):sets.includes("水2")?1-scaledElementEffect(0.08,slots):1;
    let ironMult=Math.max(0.1,1-0.15*countTraitFor(slots,"ironWall"));
    let shield=slots.reduce((total,slot)=>total+(slot&&slot.traits?slot.traits.filter(trait=>trait.id==="shieldGain").reduce((sum,trait)=>sum+(trait.value||0),0):0),0);
    let target=getComparisonTarget();
    let targetHp=target.maxHp;
    let targetDodge=Math.max(0,Number(target.dodge)||(targetHasTrait(target,"dodge")?0.20:0));
    let armorBreak=slots.flatMap(slot=>slot?.traits||[]).filter(trait=>trait.id==="armorBreak").reduce((sum,trait)=>sum+(Number(trait.value)||.10),0);
    let targetArmor=Math.max(0,Number(target.armor)||(targetHasTrait(target,"armor")?0.30:0));
    let armorMult=1-Math.max(0,targetArmor-armorBreak);
    let targetAtk=target&&target.atk>0?target.atk:50;
    let expectedCrit20x=getExpectedCrit20xMultFor(slots);
    let damage=(atk*(1+Math.min(1,Math.max(0,bj))*(bs-1))*expectedCrit20x*fireMult*(1-targetDodge)*armorMult)+targetHp*thunderRate;
    let dodgeRate=Math.min(0.90,Math.max(0,crt-(Number(target.tracking)||0)));
    if(targetHasTrait(target,"trueSight"))dodgeRate=0;
    else if(targetHasTrait(target,"phase"))dodgeRate*=0.5;
    let enemyCritMult=targetHasTrait(target,"crit")?1.125:1;
    let incoming=targetAtk*enemyCritMult*(1-dodgeRate)*waterMult*ironMult;
    let survival=(hp+shield)/Math.max(1,incoming);
    return {atk,hp,bj,bs,crt,sets,shield,damage,survival,incoming,target,expectedCrit20x};
}
function getSurvivalPressure(build){
    let capacity=build.survival;
    if(capacity<2)return {level:"critical",damageWeight:0.6,survivalWeight:2.5};
    if(capacity<4)return {level:"high",damageWeight:0.8,survivalWeight:1.6};
    return {level:"low",damageWeight:1.1,survivalWeight:0.8};
}
function pctDelta(next,current){return current>0?(next-current)/current:next>0?1:0;}
function deltaClass(value){let absolute=Math.abs(value);return absolute<0.005?"delta-same":absolute<0.02?"delta-slight":value>0?"delta-up":"delta-down";}
function trendGlyph(value){
    let absolute=Math.abs(value);
    if(absolute<0.005)return "—";
    let count=absolute<0.03?1:absolute<0.10?2:3;
    return (value>0?"▲":"▼").repeat(count);
}
function percentDeltaHtml(value){
    let absolute=Math.abs(value*100).toFixed(1),direction=trendGlyph(value);
    let label=Math.abs(value)<0.005?"几乎无变化":Math.abs(value)<0.02?(value<0?"轻微下降":"轻微提升"):"";
    return `<span class="${deltaClass(value)}">${direction} ${absolute}%${label?` ${label}`:""}</span>`;
}
function statDeltaHtml(label,next,current,percent=false){
    let delta=next-current,formatted=percent?`${delta>=0?"+":""}${(delta*100).toFixed(1)}%`:`${delta>=0?"+":""}${Math.floor(delta)}`;
    let relative=percent?Math.abs(delta)<0.005?"delta-same":Math.abs(delta)<0.02?"delta-slight":delta>0?"delta-up":"delta-down":delta===0?"delta-same":delta>0?"delta-up":"delta-down";
    return `<span class="${relative}">${label} ${formatted}</span>`;
}
function describeSets(sets){return sets.length?sets.map(set=>`${set.charAt(0)}${set.charAt(1)==="4"?"四件":"两件"}`).join(" · "):"无";}
function buildEquipAction(item,slotIndex,slots=player.slots){
    item=normalizeEquipment(item,slotIndex);
    if(!item||!equipmentSlots[slotIndex]||!equipmentSlots[slotIndex].accepts.includes(item.part))return null;
    let next=slots.slice();
    let removed=[];
    if(next[slotIndex])removed.push({slotIdx:slotIndex,equip:next[slotIndex]});
    next[slotIndex]=item;
    if(slotIndex===2&&item.part==="twoHand"&&next[3]){removed.push({slotIdx:3,equip:next[3]});next[3]=null;}
    if(slotIndex===3&&next[2]&&next[2].part==="twoHand"){removed.push({slotIdx:2,equip:next[2]});next[2]=null;}
    return {slotIdx:slotIndex,newEquip:item,oldEquip:slots[slotIndex]||null,removed,slots:next};
}
function compareCandidate(item,slotIndex){
    let action=buildEquipAction(item,slotIndex);
    if(!action)return null;
    let slots=action.slots;
    let current=deriveBuild(player.slots),next=deriveBuild(slots);
    let damageDelta=pctDelta(next.damage,current.damage),survivalDelta=pctDelta(next.survival,current.survival),pressure=getSurvivalPressure(current);
    return {slotIndex,action,current,next,pressure,damageDelta,survivalDelta,score:damageDelta*pressure.damageWeight+survivalDelta*pressure.survivalWeight};
}
function comparisonSummaryHtml(result){
    return `<div class="compare-summary"><span class="compare-pill">输出 ${percentDeltaHtml(result.damageDelta)}</span><span class="compare-pill">生存 ${percentDeltaHtml(result.survivalDelta)}</span></div>`;
}
function classifyRecommendation(result){
    let damage=result.damageDelta,survival=result.survivalDelta,pressure=result.pressure||getSurvivalPressure(result.current),survivalGain=result.next.survival-result.current.survival;
    if(result.next.survival<2&&survival<0)return {tone:"avoid",text:"不推荐 · 生存压力高"};
    if(pressure.level!=="low"&&survival<=-0.10&&damage<0.10)return {tone:"avoid",text:"不推荐 · 生存压力高"};
    if(pressure.level!=="low"&&survivalGain>=0.5&&damage>=-0.03)return {tone:"strong",text:"推荐 · 缓解生存压力"};
    if(damage>=0.05&&survival>=0.05)return {tone:"strong",text:"强烈推荐"};
    if((damage>=0.03&&survival>=-0.02)||(survival>=0.03&&damage>=-0.02))return {tone:"recommended",text:"推荐"};
    if(damage<=-0.03&&survival<=-0.03)return {tone:"avoid",text:"不推荐"};
    if(Math.abs(damage)<0.005&&Math.abs(survival)<0.005)return {tone:"neutral",text:"普通"};
    if(damage>0||survival>0)return {tone:"tradeoff",text:damage>survival?"谨慎选择 · 偏伤害":"谨慎选择 · 偏生存"};
    return {tone:"avoid",text:"不推荐"};
}
function getEquipmentComparisons(item){
    return player.slots.map((_,index)=>compareCandidate(item,index)).filter(Boolean).map(result=>({...result,oldEquip:player.slots[result.slotIndex]})).sort((a,b)=>b.score-a.score);
}
function hasSpecialTrait(item){return Boolean(item&&item.traits&&item.traits.length);}
function isBaseStatDominated(item,alternative){
    if(hasSpecialTrait(item))return false;
    let keys=["atk","hp","bj","bs","crt"];
    let allNotBetter=keys.every(key=>Number(item[key]||0)<=Number(alternative[key]||0));
    let anyWorse=keys.some(key=>Number(item[key]||0)<Number(alternative[key]||0));
    return allNotBetter&&anyWorse;
}
function getDropAdvice(items){
    return {inferiorIndexes:items.map((item,index)=>items.some((alternative,alternativeIndex)=>alternativeIndex!==index&&isBaseStatDominated(item,alternative))).map((inferior,index)=>inferior?index:null).filter(index=>index!==null)};
}
function equipmentRecommendationHtml(item){
    let comparisons=getEquipmentComparisons(item),best=comparisons[0];
    if(!best)return `<div class="recommendation avoid"><div class="recommend-title">当前没有可用部位</div><div>提升难度至 6 或永久解锁第五槽后可装备饰品。</div></div>`;
    let decision=classifyRecommendation(best);
    let before=best.current,after=best.next;
    let beforeTrait=best.oldEquip&&best.oldEquip.traits&&best.oldEquip.traits.length?best.oldEquip.traits.map(trait=>trait.name).join("·"):"无";
    let afterTrait=item.traits&&item.traits.length?item.traits.map(trait=>trait.name).join("·"):"无";
    return `<div class="recommendation ${decision.tone==="avoid"?"avoid":""}"><div class="recommend-title">${decision.text}</div>${comparisonSummaryHtml(best)}<div>${statDeltaHtml("ATK",after.atk,before.atk)} · ${statDeltaHtml("HP",after.hp,before.hp)} · ${statDeltaHtml("BJ",after.bj,before.bj,true)} · ${statDeltaHtml("BS",after.bs,before.bs,true)} · ${statDeltaHtml("闪避",after.crt,before.crt,true)}</div><div class="trait-note">套装：${describeSets(before.sets)} → ${describeSets(after.sets)} · 特性：${beforeTrait} → ${afterTrait}</div></div>`;
}

function calcBaseStats(){
    let j=jobData[player.job];
    let b=blessingData[player.blessing];
    let p=save.purchased||{egg:0,potion:0,boots:0,hat:0,doll:0};
    let difficultyScale=Math.pow(1.18,save.useBlood);
    let atk=Math.floor(j.atk*difficultyScale)+b.atk+save.pointAtk*8+p.egg*10;
    let hp=Math.floor(j.hp*difficultyScale)+b.hp+save.pointHp*5+p.potion*100;
    let bj=j.bj+b.bj+save.pointBj*0.03+p.boots*0.05;
    let bs=j.bs+b.bs+save.pointBs*0.06+p.hat*0.10;
    let crt=j.crt+b.crt+save.pointCrt*0.03+p.doll*0.05;
    return {atk,hp,bj,bs,crt};
}

function applyEquipStats(){
    let previousMax=Number(player.maxHp)||0,previousHp=Number(player.hp)||0;
    let base=calcBaseStats();
    let atk=base.atk,hp=base.hp,bj=base.bj,bs=base.bs,crt=base.crt;
    for(let s of player.slots){
        if(s){atk+=s.atk;hp+=s.hp;bj+=s.bj;bs+=s.bs;crt+=s.crt;}
    }
    atk=Math.floor(atk*getTraitMult());
    atk+=player.blessAtkAdd||0;
    atk+=player.permAtkAdd||0;
    hp+=player.blessHpAdd||0;
    hp+=player.permHpAdd||0;
    bj+=player.blessBjAdd||0;
    bs+=player.blessBsAdd||0;
    crt+=player.blessCrtAdd||0;
    player.atk=atk;player.maxHp=hp;player.hp=previousMax>0?Math.min(hp,Math.max(0,previousHp+Math.max(0,hp-previousMax))):hp;player.bj=bj;player.bs=bs;player.crt=crt;
}
function describeEquipmentTrait(trait){return trait.id==="shieldGain"?`装备后获得${trait.value||0}点持续盾`:trait.id==="armorBreak"?`攻击时破甲 ${Math.floor((trait.value||.10)*100)}%`:trait.desc;}

function oneSlotHtml(idx){
    let s=player.slots[idx];
    if(!s)return `<div class="slot">${getSlotLabel(idx)}：空</div>`;
    let traitHtml=(s.traits||[]).map(trait=>`<div class="trait">【${trait.name}】${describeEquipmentTrait(trait)}</div>`).join("");
    return `<div class="slot filled"><span class="ename">${getSlotLabel(idx)} · ${s.name}</span> <span class="${elemClass(s.element)}">【${s.element}】</span><span class="trait-note">【${equipmentPartNames[s.part]}】</span>
    <div class="estats">
    <span class="estat-item stat-atk">ATK+${s.atk}</span>
    <span class="estat-item stat-hp">HP+${s.hp}</span>
    <span class="estat-item stat-bj">BJ+${Math.floor(s.bj*100)}%</span>
    <span class="estat-item stat-bs">BS+${Math.floor(s.bs*100)}%</span>
    <span class="estat-item stat-crt">CRT+${Math.floor(s.crt*100)}%</span>
    </div>${traitHtml}</div>`;
}

/* The battle engine can keep its legacy singletons while
   callers may expose `player.allies` / `enemy.enemies` (or roster) arrays. */
function unitKind(unit,side){
    let text=String(unit&&((unit.kind||unit.type||unit.job||unit.name)||"")).toLowerCase();
    if(side==="ally"){
        if(text.includes("法")||text.includes("巫")||text.includes("术"))return "caster";
        if(text.includes("盾")||text.includes("骑")||text.includes("战士"))return "guardian";
        return "hero";
    }
    if(text.includes("史莱姆")||text.includes("泥浆")||text.includes("植物"))return "slime";
    if(text.includes("骷髅")||text.includes("僵尸")||text.includes("亡灵")||text.includes("幽灵"))return "undead";
    if(text.includes("狼")||text.includes("兽")||text.includes("蝙蝠")||text.includes("蜘蛛"))return "beast";
    if(text.includes("法师")||text.includes("巫医")||text.includes("恶魔")||text.includes("元素"))return "caster";
    return "enemy";
}
function pixelSpriteMarkup(kind){
    const palettes={hero:["#39ff8f","#ffcf9a","#4169e1"],guardian:["#88b8ff","#ffd2a6","#6f7f9f"],caster:["#d78cff","#ffd2a6","#4b2f82"],enemy:["#ff4d4d","#d48a6a","#641f32"],beast:["#ff9d5c","#c56a43","#723c29"],undead:["#b5c3cc","#d7e2e8","#596875"],slime:["#64e6c0","#b6ffe9","#218f79"]};
    const [body,skin,shade]=palettes[kind]||palettes.enemy;
    const ears=(kind==="beast"||kind==="enemy")?`<rect x="2" y="3" width="3" height="4" fill="${shade}"/><rect x="11" y="3" width="3" height="4" fill="${shade}"/>`:"";
    const weapon=(kind==="hero"||kind==="guardian")?`<rect x="13" y="9" width="2" height="6" fill="#e9e3c2"/><rect x="14" y="8" width="1" height="1" fill="#fff6c4"/>`:kind==="caster"?`<rect x="13" y="8" width="2" height="7" fill="#8b6b43"/><rect x="13" y="7" width="3" height="2" fill="#d78cff"/>`:"";
    return `<svg class="pixel-sprite" viewBox="0 0 16 16" role="img" aria-label="像素单位"><rect x="5" y="2" width="6" height="2" fill="${skin}"/>${ears}<rect x="4" y="4" width="8" height="5" fill="${skin}"/><rect x="5" y="5" width="2" height="2" fill="#10140f"/><rect x="9" y="5" width="2" height="2" fill="#10140f"/><rect x="6" y="7" width="4" height="1" fill="${shade}"/><rect x="3" y="9" width="10" height="5" fill="${body}"/><rect x="5" y="14" width="2" height="2" fill="${shade}"/><rect x="9" y="14" width="2" height="2" fill="${shade}"/>${weapon}</svg>`;
}
function enemyAvatarSeed(name){
    let text=String(name||"敌人");
    let hash=2166136261;
    for(let index=0;index<text.length;index++){hash^=text.charCodeAt(index);hash=Math.imul(hash,16777619);}
    return hash>>>0;
}
function enemyPixelSpriteMarkup(name,kind="enemy"){
    let safeName=String(name||"敌人").replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[character]));
    let seed=enemyAvatarSeed(name),pick=(count,offset=0)=>(seed+offset) % count;
    const palettes=[
        ["#ff4d4d","#d48a6a","#641f32"],["#ff9d5c","#e8b08b","#723c29"],["#d78cff","#d7b1ff","#4b2f82"],
        ["#64e6c0","#b6ffe9","#218f79"],["#b5c3cc","#d7e2e8","#596875"],["#ffe16b","#ffd0a3","#8a5a21"]
    ];
    let palette=palettes[pick(palettes.length,17)],body=palette[0],skin=palette[1],shade=palette[2];
    let silhouette=pick(3,29),feature=pick(6,47),eye=pick(3,71);
    let top=silhouette===0?`<polygon points="2,6 4,2 6,4 8,1 10,4 12,2 14,6" fill="${shade}"/>`:silhouette===1?`<polygon points="2,5 4,2 6,4 8,3 10,4 12,2 14,5 13,9 3,9" fill="${shade}"/>`:"";
    let append=feature===0?`<polygon points="3,4 0,1 1,7" fill="${shade}"/><polygon points="13,4 16,1 15,7" fill="${shade}"/>`:feature===1?`<polygon points="3,5 0,3 1,8 5,7" fill="${body}"/><polygon points="13,5 16,3 15,8 11,7" fill="${body}"/>`:feature===2?`<polygon points="3,8 0,5 1,10 4,9" fill="${body}"/><polygon points="13,8 16,5 15,10 12,9" fill="${body}"/>`:feature===3?`<rect x="1" y="10" width="2" height="4" fill="${shade}"/><rect x="13" y="10" width="2" height="4" fill="${shade}"/>`:feature===4?`<rect x="2" y="1" width="2" height="5" fill="${shade}"/><rect x="12" y="1" width="2" height="5" fill="${shade}"/>`:"";
    let eyes=eye===0?`<rect x="4" y="6" width="2" height="2" fill="#10140f"/><rect x="10" y="6" width="2" height="2" fill="#10140f"/>`:eye===1?`<rect x="4" y="6" width="3" height="1" fill="#10140f"/><rect x="9" y="6" width="3" height="1" fill="#10140f"/>`:`<rect x="7" y="5" width="2" height="3" fill="#10140f"/>`;
    let tentacles=feature===5?`<rect x="4" y="14" width="1" height="2" fill="${shade}"/><rect x="7" y="14" width="1" height="2" fill="${shade}"/><rect x="10" y="14" width="1" height="2" fill="${shade}"/>`:"";
    return `<svg class="pixel-sprite enemy-pixel-sprite" viewBox="0 0 16 16" role="img" aria-label="敌方像素头像：${safeName}" data-avatar-seed="${seed}">${top}${append}<rect x="4" y="4" width="8" height="6" fill="${skin}"/>${eyes}<rect x="6" y="8" width="4" height="1" fill="${shade}"/><rect x="3" y="9" width="10" height="5" fill="${body}"/><rect x="5" y="14" width="2" height="2" fill="${shade}"/><rect x="9" y="14" width="2" height="2" fill="${shade}"/>${tentacles}</svg>`;
}
function rosterUnits(side){
    let source=side==="ally"?player:enemy;
    let explicit=source&&(Array.isArray(source.allies)&&side==="ally"?source.allies:Array.isArray(source.enemies)&&side!=="ally"?source.enemies:Array.isArray(source.roster)?source.roster:null);
    if(Array.isArray(explicit)&&explicit.length)return explicit;
    return [source||{}];
}
function setCombatantSprite(card,unit,side){
    let kind=unitKind(unit,side),avatar=card&&card.querySelector(".pixel-avatar");
    if(card){card.dataset.unitKind=kind;card.setAttribute("aria-label",`${side==="ally"?"我方":"敌方"}单位：${unit.name||unit.job||"未命名"}`);}
    if(avatar)avatar.innerHTML=side==="enemy"?enemyPixelSpriteMarkup(unit&&unit.name,kind):pixelSpriteMarkup(kind);
    return kind;
}
function createRosterCard(unit,side,index){
    let card=document.createElement("article");
    card.className=`combatant ${side==="ally"?"player":"enemy"}`;
    card.dataset.rosterUnit=String(index);card.dataset.unitSide=side;
    card.innerHTML=`<div class="pixel-avatar"></div><div class="combatant-name"></div><div class="combatant-atk"></div><div class="battle-meter"><div class="fill ${side==="ally"?"":"enemy-fill"}"></div></div><div class="battle-number"></div><div class="trait-note"></div>`;
    setCombatantSprite(card,unit,side);
    card.querySelector(".combatant-name").textContent=unit.name||unit.job|| (side==="ally"?"友军":"敌人");
    card.querySelector(".combatant-atk").textContent=`ATK ${unit.atk??"—"}`;
    let hp=Number(unit.hp)||0,max=Number(unit.maxHp)||hp||1,pct=Math.max(0,Math.min(100,hp/max*100));
    card.querySelector(".fill").style.width=`${pct}%`;
    card.querySelector(".battle-number").textContent=`${hp} / ${max}`;
    let trait=card.querySelector(".trait-note");
    trait.textContent=(unit.traits||[]).map(t=>`【${t.name||t.id||"特性"}】${t.desc||""}`).join(" ");
    return card;
}
function renderBattleRoster(){
    let allyRoot=document.getElementById("allyRoster"),enemyRoot=document.getElementById("enemyRoster");
    if(!allyRoot||!enemyRoot)return;
    let allies=rosterUnits("ally"),enemies=rosterUnits("enemy");
    let allyPrimary=document.getElementById("playerCombatant"),enemyPrimary=document.getElementById("enemyBarArea");
    setCombatantSprite(allyPrimary,allies[0],"ally");setCombatantSprite(enemyPrimary,enemies[0],"enemy");
    allyRoot.querySelectorAll("[data-roster-unit]").forEach(node=>node.remove());
    enemyRoot.querySelectorAll("[data-roster-unit]").forEach(node=>node.remove());
    for(let i=1;i<allies.length;i++)allyRoot.appendChild(createRosterCard(allies[i],"ally",i));
    for(let i=1;i<enemies.length;i++)enemyRoot.appendChild(createRosterCard(enemies[i],"enemy",i));
    allyRoot.dataset.unitCount=String(allies.length);enemyRoot.dataset.unitCount=String(enemies.length);
}

function showBattleFeedback(side,text,type="damage"){
    let combatant=document.getElementById(side==="enemy"?"enemyBarArea":"playerCombatant");
    let event=document.getElementById("battleEvent");
    if(event)event.textContent=text;
    if(!combatant)return;
    combatant.classList.remove("hit","heal","attack","dodge");
    void combatant.offsetWidth;
    combatant.classList.add(type==="heal"?"heal":type==="dodge"?"dodge":type==="attack"?"attack":"hit");
    let float=document.createElement("span");
    float.className=`battle-float ${type}`;
    float.textContent=text;
    combatant.appendChild(float);
    setTimeout(()=>float.remove(),850);
}

function refreshHpBar(){
    renderBattleRoster();
    let arena=document.getElementById("battleArena");
    let active=Boolean(enemy.name&&enemy.maxHp>0&&(gameState==="battle"||gameState==="bossBattle"));
    if(arena)arena.hidden=!active;
    let hpNums=document.getElementById("hpNums");
    let hpFill=document.getElementById("hpBarFill");
    if(hpNums)hpNums.textContent=`${player.hp} / ${player.maxHp}`;
    if(hpFill){
        let pct=player.maxHp>0?Math.max(0,Math.min(100,player.hp/player.maxHp*100)):0;
        hpFill.style.width=pct+"%";
        hpFill.className=`fill${pct<30?" low":""}`;
    }
    let shieldWrap=document.getElementById("shieldBarWrap");
    let shieldFill=document.getElementById("shieldBarFill");
    if(shieldWrap&&shieldFill){
        let totalShield=shieldTotal(player);
        if(totalShield>0){
            shieldWrap.style.display="block";
            let spct=player.maxHp>0?Math.min(100,totalShield/player.maxHp*100):0;
            shieldFill.style.width=spct+"%";
            shieldFill.className="fill";
            let shieldNums=document.getElementById("shieldNums");
            if(shieldNums)shieldNums.textContent=shieldSummary(player);
        }else{
            shieldWrap.style.display="none";
        }
    }
    let enemyArea=document.getElementById("enemyBarArea");
    let enemyLabel=document.getElementById("enemyBarLabel");
    let enemyNums=document.getElementById("enemyHpNums");
    let enemyFill=document.getElementById("enemyBarFill");
    let enemyTraitDesc=document.getElementById("enemyTraitDesc");
    if(enemyArea&&active){
        enemyArea.style.display="grid";
        enemyLabel.textContent=enemy.name;
        enemyNums.textContent=`${Math.max(0,enemy.hp)} / ${enemy.maxHp}`;
        let epct=enemy.maxHp>0?Math.max(0,Math.min(100,enemy.hp/enemy.maxHp*100)):0;
        enemyFill.style.width=epct+"%";
        enemyFill.className="fill enemy-fill";
        let playerName=document.getElementById("battlePlayerName");
        let playerAtk=document.getElementById("battlePlayerAtk");
        let enemyAtk=document.getElementById("battleEnemyAtk");
        if(playerName)playerName.textContent=player.job||"勇者";
        if(playerAtk)playerAtk.textContent=`ATK ${player.atk} · 能量 ${player.energy}/100`;
        if(enemyAtk)enemyAtk.textContent=`ATK ${enemy.atk} · ${enemy.hits}段 · 追踪${Math.floor(enemy.tracking*100)}% · 闪避${Math.floor(enemy.dodge*100)}% · 护甲${Math.floor(enemy.armor*100)}%${shieldTotal(enemy)>0?` · 盾${shieldTotal(enemy)}`:""}`;
        if(enemyTraitDesc){
            if(enemy.traits&&enemy.traits.length>0){
                enemyTraitDesc.textContent="";
                for(let trait of enemy.traits){
                    let item=document.createElement("span");
                    item.className="trait-item";
                    item.textContent=`【${trait.name}】${trait.desc}`;
                    enemyTraitDesc.appendChild(item);
                }
                enemyTraitDesc.style.display="block";
            }else{
                enemyTraitDesc.textContent="";
                enemyTraitDesc.style.display="none";
            }
        }
    }else if(enemyArea){
        enemyArea.style.display="none";
    }
}
function showSetInfo(){
    cancelLootAutoSelect();
    let c=getElemCount();
    let rules=[
        {element:"火",className:"elem-fire",two:"攻击伤害 +10%；战胜攻击 +4%",four:"攻击伤害 +25%；战胜攻击 +10%"},
        {element:"水",className:"elem-water",two:"受到伤害 -8%；战胜血量 +4%",four:"受到伤害 -20%；战胜血量 +10%"},
        {element:"草",className:"elem-grass",two:"装备特性触发概率 ×1.5",four:"装备特性触发概率 ×2.5"},
        {element:"雷",className:"elem-thunder",two:"攻击附加敌方当前 HP 3% 伤害",four:"攻击附加敌方当前 HP 6% 伤害"}
    ];
    let resonance=hasPrismaticResonance()?`<article class="set-card is-active"><h3>【四色共鸣】已激活</h3><div class="set-tier active">受到伤害 -12%；其他元素套装效果 +50%；所有恢复上限 +20%；进战获得最大生命 8% 临时盾，每回合恢复 2% 临时盾。</div></article>`:`<article class="set-card"><h3>【四色共鸣】未激活</h3><div class="set-tier">火、水、草、雷各装备至少 1 件即可激活。</div></article>`;
    document.getElementById("setContent").innerHTML=resonance+rules.map(rule=>{
        let amount=c[rule.element],twoActive=amount>=2&&amount<4,fourActive=amount>=4;
        let twoText=twoActive?"已激活":fourActive?"由四件套覆盖":`未激活 · 还差 ${2-amount} 件`;
        let fourText=fourActive?"已激活":`未激活 · 还差 ${4-amount} 件`;
        let scale=hasPrismaticResonance()?1.5:1;
        let actualTwo=rule.element==="火"?`攻击伤害 +${10*scale}%；战胜攻击 +${4*scale}%`:rule.element==="水"?`受到伤害 -${8*scale}%；战胜血量 +${4*scale}%`:rule.element==="草"?`装备特性触发概率 ×${1.5*scale}`:`攻击附加敌方当前 HP ${3*scale}% 伤害`;
        let actualFour=rule.element==="火"?`攻击伤害 +${25*scale}%；战胜攻击 +${10*scale}%`:rule.element==="水"?`受到伤害 -${20*scale}%；战胜血量 +${10*scale}%`:rule.element==="草"?`装备特性触发概率 ×${2.5*scale}`:`攻击附加敌方当前 HP ${6*scale}% 伤害`;
        return `<article class="set-card ${amount>=2?"is-active":""}"><h3 class="${rule.className}">【${rule.element}】 当前 ${amount} 件</h3><div class="set-tier ${twoActive?"active":""}">二件套 · ${twoText}<br>${actualTwo}</div><div class="set-tier ${fourActive?"active":""}">四件套 · ${fourText}<br>${actualFour}</div></article>`;
    }).join("");
    document.getElementById("setOverlay").hidden=false;
}
function getDifficultyEffects(level){
    let effects=[];
    if(level>=3)effects.push("开局随机禁用一个职业和一项祝福；回复上限从最大生命60%起继续衰减");
    if(level>=5)effects.push("敌人追踪随波次与难度成长，并与玩家闪避相减；敌人单段攻击伤害 -10%");
    if(level>=7)effects.push("玩家造成的伤害 -20%");
    if(level>=9)effects.push("遭遇普通敌人时有 30% 概率随机失去一件装备");
    if(level>=3)effects.push("装备掉落开放额外效果与 1 条词条");
    if(level>=6)effects.push("装备掉落至多 2 条词条，并开放饰品第五槽");
    if(level>=9)effects.push("装备掉落至多 3 条强化词条");
    return effects.length?effects.join("；"):"暂无额外规则。";
}
function getDifficultyTraits(level){
    if(level>=8)return "敌人保底拥有 1 种词条；最多 3 种，出现概率 ×1.5。";
    if(level>=6)return "敌人最多拥有 3 种词条，出现概率 ×1.5。";
    if(level>=4)return "敌人最多拥有 3 种词条。";
    return "敌人最多拥有 1 种词条，按基础概率出现。";
}
function getDifficultyGoldMultiplier(level=save.useBlood){return 1+Math.min(10,Math.max(0,Math.floor(Number(level)||0)))*0.10;}
function renderDifficultyPanel(){
    let unlocked=Math.min(10,Math.max(0,Number(save.blood)||0));
    let level=Math.min(unlocked,Math.max(0,Math.floor(difficultyDraft)));
    difficultyDraft=level;
    let adjustable=Boolean(player.canAdjustPoint);
    document.getElementById("difficultySelected").textContent=level;
    document.getElementById("difficultyFocusCaption").textContent=`难度 ${level}`;
    document.getElementById("difficultyMultiplier").textContent=`敌人攻击力与生命值 ×${Math.pow(1.4,level).toFixed(2)}；胜利金币 ×${getDifficultyGoldMultiplier(level).toFixed(2)}（每级金币 +10%）。`;
    document.getElementById("difficultyTraits").textContent=getDifficultyTraits(level);
    document.getElementById("difficultyEffects").textContent=getDifficultyEffects(level);
    document.getElementById("btnDifficultyPrev").disabled=!adjustable||level<=0;
    document.getElementById("btnDifficultyNext").disabled=!adjustable||level>=unlocked;
    document.getElementById("btnDifficultyApply").disabled=!adjustable||level===save.useBlood;
    document.getElementById("difficultyLockNote").textContent=adjustable?`已解锁 ${unlocked}/10 级；难度 3/6/9 分别提升装备词条，6 级起第五槽由难度或商城任一来源开放。`:"本局已经开始，难度已锁定。";
}
function showDifficultyInfo(){
    cancelLootAutoSelect();
    difficultyDraft=Math.max(0,Math.min(10,Number(save.useBlood)||0));
    renderDifficultyPanel();
    document.getElementById("difficultyOverlay").hidden=false;
}
function shiftDifficulty(delta){
    if(!player.canAdjustPoint)return;
    difficultyDraft=Math.max(0,Math.min(Math.min(10,Number(save.blood)||0),difficultyDraft+delta));
    renderDifficultyPanel();
}
function applyDifficultySelection(){
    if(!player.canAdjustPoint)return;
    save.useBlood=difficultyDraft;
    writeSave();
    if(player.job){syncSlotCapacity();applyEquipStats();}
    refreshStatPanel();
    document.getElementById("difficultyOverlay").hidden=true;
}
function closeDifficultyPanel(){
    difficultyDraft=save.useBlood;
    document.getElementById("difficultyOverlay").hidden=true;
    resumeLootAutoSelectIfReady();
}
function openShop(){
    cancelLootAutoSelect();
    resetConfirmationPending=false;
    document.getElementById("shopOverlay").hidden=false;
    renderShop();
}
function renderShop(notice=""){
    let p=save.purchased;
    let products=[
        ["美味的鸡蛋","永久 +10 攻击力","egg",500],
        ["难闻的药水","永久 +100 生命值","potion",500],
        ["很热的长靴","永久 +5% 暴击率","boots",700],
        ["很凉的帽子","永久 +10% 暴击伤害","hat",800],
        ["可爱的替身娃娃","永久 +5% 闪避率","doll",800]
    ];
    document.getElementById("shopNotice").textContent=notice||(cheatMode?"作弊模式：道具可免费增减。":`当前金币：${save.gold||0}`);
    let productHtml=products.map(([name,desc,key,price])=>`<article class="modal-card"><h3>${name}</h3><div>${desc}</div><div>${cheatMode?`已购 ${p[key]}/10（免费）`:`价格：${price} 金币 · 已购 ${p[key]}/10`}</div>${cheatMode?`<div class="cheat-shop-controls"><button class="choice-btn" onclick="adjustCheatItem('${key}',-1)" ${p[key]<=0?"disabled":""}>−</button><span class="cheat-count">${p[key]}</span><button class="choice-btn" onclick="adjustCheatItem('${key}',1)" ${p[key]>=10?"disabled":""}>+</button></div>`:`<button class="choice-btn" onclick="buyItem('${key}',${price},10)">${p[key]>=10?"已达限购":"购买"}</button>`}</article>`).join("");
    let extraHtml=cheatMode?`<div class="cheat-banner">作弊模式已激活 · 退出后全部回退</div><article class="modal-card"><h3>额外装备槽位</h3><div>作弊模式下可自由切换。</div><button class="choice-btn" onclick="toggleCheatSlot5()">${save.slot5Unlocked?"关闭第五槽位":"开启第五槽位"}</button></article><article class="modal-card"><h3>退出作弊模式</h3><div>永久成长、商城道具和槽位会回退到进入前的状态。</div><button class="choice-btn danger" onclick="exitCheatMode()">退出并回退</button></article>`:`<article class="modal-card"><h3>潘多拉之盒</h3><div>随机奖励，也可能触发大记忆消失术。</div><div>价格：200 金币</div><button class="choice-btn" onclick="buyPandora()">开启</button></article><article class="modal-card"><h3>额外装备槽位</h3><div>永久解锁第五个装备槽位。</div><div>${save.slot5Unlocked?"已解锁":"价格：5000 金币"}</div><button class="choice-btn" onclick="buySlot5()" ${save.slot5Unlocked?"disabled":""}>${save.slot5Unlocked?"已解锁":"购买"}</button></article><article class="modal-card"><h3>大记忆消失术</h3><div>清除所有商城购买效果，返还限购次数。</div><div>价格：10 金币</div>${resetConfirmationPending?`<div class="modal-notice">此操作会清除所有商城购买效果，无法撤销。</div><div class="modal-actions"><button class="choice-btn danger" onclick="confirmReset()">确认施放</button><button class="choice-btn" onclick="cancelReset()">取消</button></div>`:`<button class="choice-btn danger" onclick="requestReset()">施放</button>`}</article>`;
    document.getElementById("shopContent").innerHTML=productHtml+extraHtml;
}
function closeShop(){
    resetConfirmationPending=false;
    document.getElementById("shopOverlay").hidden=true;
    collapseTerminalEvents();
    refreshStatPanel();
    resumeLootAutoSelectIfReady();
}
function tryCheatCode(){let input=document.getElementById("cheatCodeInput"),notice=document.getElementById("cheatCodeNotice"),value=(input.value||"").trim();if(!value){notice.textContent="请输入秘钥。";return;}if(value!==CHEAT_SECRET){notice.textContent="秘钥错误。";return;}if(!cheatMode){cheatBackup=cloneForStorage(save);cheatMode=true;localStorage.setItem("kasandri6_cheat_backup",JSON.stringify(cheatBackup));save.eyeTotal=24;save.blood=10;save.useBlood=10;writeSave();if(player.job){applyEquipStats();refreshStatPanel();}autoSaveRun();}input.value="";notice.textContent="作弊模式已激活。";}
function exitCheatMode(){if(!cheatMode||!cheatBackup)return;save=normalizeSave(cheatBackup);cheatMode=false;cheatBackup=null;localStorage.removeItem("kasandri6_cheat_backup");if(player.job){syncSlotCapacity();applyEquipStats();}writeSave();renderShop("已退出作弊模式，数据已回退。");}
function adjustCheatItem(key,delta){if(!cheatMode)return;save.purchased[key]=Math.max(0,Math.min(10,(save.purchased[key]||0)+delta));writeSave();if(player.job)applyEquipStats();renderShop();}
function toggleCheatSlot5(){if(!cheatMode)return;save.slot5Unlocked=!save.slot5Unlocked;if(player.job){syncSlotCapacity();applyEquipStats();}writeSave();renderShop();}
function buySlot5(){
    if(save.slot5Unlocked){renderShop("第五个装备槽位已经解锁。");return;}
    if((save.gold||0)<5000){renderShop("金币不足，无法购买第五个装备槽位。");return;}
    save.gold-=5000;
    save.slot5Unlocked=true;
    writeSave();
    if(player.job){syncSlotCapacity();applyEquipStats();refreshStatPanel();}
    autoSaveRun();
    renderShop("第五个装备槽位已永久解锁！");
}
function shopReturn(){
    closeShop();
}
function buyItem(key,price,limit){
    let p=save.purchased;
    if(p[key]>=limit){renderShop("该商品已达限购上限。");return;}
    if((save.gold||0)<price){renderShop("金币不足，购买失败。");return;}
    save.gold-=price;
    p[key]++;
    writeSave();
    if(player.job){applyEquipStats();refreshStatPanel();}
    autoSaveRun();
    renderShop(`购买成功！剩余金币：${save.gold}`);
}
function requestReset(){
    if((save.gold||0)<10){renderShop("金币不足，无法施放大记忆消失术。");return;}
    resetConfirmationPending=true;
    renderShop("请确认是否施放大记忆消失术。");
}
function cancelReset(){
    resetConfirmationPending=false;
    renderShop("已取消大记忆消失术。");
}
function confirmReset(){
    if(!resetConfirmationPending)return;
    resetConfirmationPending=false;
    if((save.gold||0)<10){renderShop("金币不足，无法施放大记忆消失术。");return;}
    save.gold-=10;
    save.purchased={egg:0,potion:0,boots:0,hat:0,doll:0};
    writeSave();
    if(player.job){applyEquipStats();refreshStatPanel();}
    autoSaveRun();
    renderShop("大记忆消失术生效！所有商城购买效果已清除，限购已返还。");
}
function buyPandora(){
    if((save.gold||0)<200){renderShop("金币不足，无法开启潘多拉之盒。");return;}
    save.gold-=200;
    let r=Math.random()*100;
    let result="";
    if(r<10){save.gold+=10;result="潘多拉之盒：获得10金币！";}
    else if(r<30){save.gold+=50;result="潘多拉之盒：获得50金币！";}
    else if(r<68){save.gold+=100;result="潘多拉之盒：获得100金币！";}
    else if(r<78){save.gold+=500;result="潘多拉之盒：获得500金币！";}
    else if(r<88){save.gold+=800;result="潘多拉之盒：获得800金币！";}
    else if(r<98){
        let items=["egg","potion","boots","hat","doll"];
        let prices=[500,500,700,800,800];
        let names=["美味的鸡蛋","难闻的药水","很热的长靴","很凉的帽子","可爱的替身娃娃"];
        let idx=Math.floor(Math.random()*5);
        let key=items[idx];
        if(save.purchased[key]<10){
            save.purchased[key]++;
            result=`潘多拉之盒：获得商品【${names[idx]}】！`;
        }else{
            save.gold+=prices[idx];
            result=`潘多拉之盒：本应获得【${names[idx]}】，但已达限购，返还${prices[idx]}金币！`;
        }
    }else{
        save.purchased={egg:0,potion:0,boots:0,hat:0,doll:0};
        result="潘多拉之盒：触发大记忆消失术！所有商城购买效果已清除！";
    }
    writeSave();
    if(player.job){applyEquipStats();refreshStatPanel();}
    autoSaveRun();
    renderShop(`${result} 当前金币：${save.gold}`);
}
function refreshStatPanel(){
    let sets=getSetBonus();
    let setText=sets.length>0?sets.map(t=>`<span class="${elemClass(t.charAt(0))}">【${t.charAt(0)}${t.length>1&&t.charAt(1)==="4"?"四件":"两件"}】</span>`).join(" "):"无";
    let usedEye=save.pointAtk+save.pointHp+save.pointBj+save.pointBs+save.pointCrt;
    let html=`
    <div class="eye-info">魔王之眼：${save.eyeTotal}/24 | 已用：${usedEye}</div>
    <div class="eye-info">它之血珠：${save.blood} | 难度：${save.useBlood}/10</div>
    <div class="eye-info">金币：${save.gold||0}</div>
    <div class="hud-actions"><button class="hud-action" onclick="openSaveManager()">${svgUse("save")}存档</button><button class="hud-action shop" onclick="openShop()">${svgUse("shop")}商城</button>${pendingLoot?`<button class="hud-action pending" onclick="resumeLootChoice()">${svgUse("resume")}继续选择装备</button>`:""}<button class="hud-action sets" onclick="showDifficultyInfo()">难度设定</button><button class="hud-action sets" onclick="showSetInfo()">${svgUse("sets")}元素套装详情</button></div>
    <div class="stat-row"><span class="label">职业</span><span class="value">${player.job||"-"}</span></div>
    <div class="stat-row"><span class="label">祝福</span><span class="value">${player.blessing||"-"}</span></div>
    <div class="stat-row"><span class="label">攻击力</span><span class="value stat-atk">${player.atk}</span></div>
    <div class="stat-row"><span class="label">血量上限</span><span class="value stat-hp">${player.maxHp}</span></div>
    <div class="stat-row"><span class="label">暴击率</span><span class="value stat-bj">${Math.floor(player.bj*100)}%</span></div>
    <div class="stat-row"><span class="label">暴击伤害</span><span class="value stat-bs">${Math.floor(player.bs*100)}%</span></div>
    <div class="stat-row"><span class="label">闪避率</span><span class="value stat-crt">${Math.floor(player.crt*100)}%</span></div>
    <div class="stat-row"><span class="label">能量</span><span class="value">${player.energy}/100</span></div>
    <div class="stat-row"><span class="label">套装效果</span><span class="value">${setText}</span></div>
    <div class="equip-slots"><h4>装备槽位</h4><div class="slot-grid">__SLOTS__</div></div>
    <div class="point-controls">
    <div class="point-row difficulty-row"><span class="plabel">难度等级</span><button class="difficulty-open" onclick="showDifficultyInfo()">难度 ${save.useBlood}/10 · ${player.canAdjustPoint?"调整":"已锁定"}</button></div>
    <div class="point-row"><span class="plabel stat-atk">攻击力</span><button onclick="adjPoint('atk',-1)" ${player.canAdjustPoint&&save.pointAtk>0?"":"disabled"}>-</button><span class="pval stat-atk">${save.pointAtk}</span><button onclick="adjPoint('atk',1)" ${player.canAdjustPoint&&usedEye<save.eyeTotal?"":"disabled"}>+</button></div>
    <div class="point-row"><span class="plabel stat-hp">血量</span><button onclick="adjPoint('hp',-1)" ${player.canAdjustPoint&&save.pointHp>0?"":"disabled"}>-</button><span class="pval stat-hp">${save.pointHp}</span><button onclick="adjPoint('hp',1)" ${player.canAdjustPoint&&usedEye<save.eyeTotal?"":"disabled"}>+</button></div>
    <div class="point-row"><span class="plabel stat-bj">暴击率</span><button onclick="adjPoint('bj',-1)" ${player.canAdjustPoint&&save.pointBj>0?"":"disabled"}>-</button><span class="pval stat-bj">${save.pointBj}</span><button onclick="adjPoint('bj',1)" ${player.canAdjustPoint&&usedEye<save.eyeTotal?"":"disabled"}>+</button></div>
    <div class="point-row"><span class="plabel stat-bs">暴击伤害</span><button onclick="adjPoint('bs',-1)" ${player.canAdjustPoint&&save.pointBs>0?"":"disabled"}>-</button><span class="pval stat-bs">${save.pointBs}</span><button onclick="adjPoint('bs',1)" ${player.canAdjustPoint&&usedEye<save.eyeTotal?"":"disabled"}>+</button></div>
    <div class="point-row"><span class="plabel stat-crt">闪避率</span><button onclick="adjPoint('crt',-1)" ${player.canAdjustPoint&&save.pointCrt>0?"":"disabled"}>-</button><span class="pval stat-crt">${save.pointCrt}</span><button onclick="adjPoint('crt',1)" ${player.canAdjustPoint&&usedEye<save.eyeTotal?"":"disabled"}>+</button></div>
    </div>`;
    let slotsHtml="";
    for(let i=0;i<player.slots.length;i++)slotsHtml+=oneSlotHtml(i);
    html=html.replace("__SLOTS__",slotsHtml);
    statContent.innerHTML=html;
    refreshHpBar();
}

function adjPoint(type,delta){
    if(!player.canAdjustPoint)return;
    let usedEye=save.pointAtk+save.pointHp+save.pointBj+save.pointBs+save.pointCrt;
    let key="point"+type.charAt(0).toUpperCase()+type.slice(1);
    if(delta>0&&usedEye<save.eyeTotal){save[key]++;}
    else if(delta<0&&save[key]>0){save[key]--;}
    writeSave();
    if(player.job){applyEquipStats();}
    refreshStatPanel();
}

function genEquip(wave){
    if(wave===undefined)wave=player.wave;
    let parts=["head","body","oneHand","oneHand","twoHand","offHand"];
    if(getSlotCount()>=5)parts.push("accessory","outerwear");
    let part=pick(parts);
    let nounByPart={head:["头盔","面纱","假发"],body:["铠甲","胸甲","战甲","布衣"],oneHand:["长剑","战斧","匕首","法杖","短刀"],twoHand:["巨锤","大剑","长弓","战戟","双刃剑"],offHand:["盾牌","骨盾"],accessory:["戒指","项链","护符","念珠","水晶球"],outerwear:["披风","斗篷","靴子","鞋子","手套","翅膀","背包","臂甲","胫甲"]};
    let name=pick(lootAdj)+pick(nounByPart[part]||lootNoun);
    let element=pick(elements);
    let scale=1+Math.min(1,wave/20)*1.0;
    let atk=Math.floor(rand(5,25)*scale),hp=Math.floor(rand(10,80)*scale),bj=rand(0,8)/100,bs=rand(0,10)/100,crt=rand(0,8)/100;
    bj=Math.floor(bj*scale*100)/100;bs=Math.floor(bs*scale*100)/100;crt=Math.floor(crt*scale*100)/100;
    let traits=[];
    let tier=save.useBlood>=9?3:save.useBlood>=6?2:save.useBlood>=3?1:0;
    let traitProb=0.15+Math.min(1,wave/20)*0.15+(tier?0.08:0);
    let maxTraits=tier;
    let used={};
    for(let index=0;index<maxTraits;index++)if(Math.random()<traitProb){
        let candidates=getEquipmentTraitPool(tier).filter(trait=>!used[trait.id]);
        if(candidates.length){let trait=pick(candidates);used[trait.id]=true;if(trait.id==="shieldGain")trait={...trait,value:pick([500,800,1000].slice(0,tier))};if(trait.id==="armorBreak")trait={...trait,value:[0.10,0.15,0.20][Math.max(0,tier-1)]};traits.push(trait);}
    }
    return {name,element,part,atk,hp,bj,bs,crt,traits,affixTier:tier};
}

function equipmentCardHtml(e,includeRecommendation=false){
    let traitHtml="";
    if(e.traits){
        traitHtml=e.traits.map(trait=>`<div class="trait">【${trait.name}】${describeEquipmentTrait(trait)}</div>`).join("");
    }
    let recommendation=includeRecommendation?equipmentRecommendationHtml(e):"";
    return `<div class="equipment-card"><div class="equip-title">${e.name} <span class="${elemClass(e.element)}">【${e.element}】</span> <span class="trait-note">【${equipmentPartNames[e.part]||"未知部位"}】${e.affixTier?` · 词条阶 ${e.affixTier}`:""}</span></div><div class="equip-stats"><span class="stat-atk">ATK +${e.atk}</span> · <span class="stat-hp">HP +${e.hp}</span> · <span class="stat-bj">BJ +${Math.floor(e.bj*100)}%</span> · <span class="stat-bs">BS +${Math.floor(e.bs*100)}%</span> · <span class="stat-crt">CRT +${Math.floor(e.crt*100)}%</span></div>${traitHtml}${recommendation}</div>`;
}
function showEquip(e,includeRecommendation=false){
    print(equipmentCardHtml(e,includeRecommendation),"",true);
}

function equipToSlot(e,chosenIdx){
    let comparisons=getEquipmentComparisons(e);
    if(!comparisons.length){print("该装备没有可用部位，已放弃。");return false;}
    let empty=comparisons.find(result=>!result.oldEquip&&result.action.removed.length===0);
    if(!empty){renderReplacementChoices(e,chosenIdx);return true;}
    let action=empty.action;
    lastEquipAction={...action,chosenIdx:chosenIdx,previousSlots:player.slots.slice()};
    player.slots=action.slots;
    applyEquipStats();
    refreshStatPanel();
    confirmEquip();
}
function renderReplacementChoices(e,chosenIdx){
    cancelLootAutoSelect();
    let best=getEquipmentComparisons(e)[0];
    let choices=getEquipmentComparisons(e).map(comparison=>{
        let index=comparison.slotIndex,recommended=index===best.slotIndex,removed=comparison.action.removed.map(entry=>`【${entry.equip.name}】`).join("、")||"无";
        return `<article class="modal-card ${recommended?"is-recommended":""}"><h3>${getSlotLabel(index)}</h3>${player.slots[index]?equipmentCardHtml(player.slots[index]):"<p>空位</p>"}<div class="replace-delta">更换后：${comparisonSummaryHtml(comparison)}<br>将卸下：${removed}</div><button class="choice-btn" onclick="replaceEquip(${index},${chosenIdx})">装备到${getSlotLabel(index)}</button></article>`;
    }).join("");
    document.getElementById("lootContent").innerHTML=`<p class="modal-note">请选择合法装备位置；双手武器会卸下副手，副手或双持会卸下双手武器。</p><div class="modal-grid">${choices}</div><div class="modal-actions"><button class="choice-btn" onclick="renderLootChoice()">返回掉落选择</button><button class="choice-btn danger" onclick="declineLoot()">放弃这件装备</button></div>`;
}
function replaceEquip(slotIndex,chosenIdx){
    if(!pendingLoot)return;
    cancelLootAutoSelect();
    let e=chosenIdx===1?pendingLoot.e1:pendingLoot.e2;
    let action=buildEquipAction(e,slotIndex);
    if(!action){renderLootChoice();return;}
    lastEquipAction={...action,chosenIdx,previousSlots:player.slots.slice()};
    player.slots=action.slots;
    applyEquipStats();
    refreshStatPanel();
    confirmEquip();
}
function confirmEquip(){
    if(!lastEquipAction)return;
    cancelLootAutoSelect();
    let action=lastEquipAction;
    let removed=action.removed&&action.removed.length?action.removed.map(entry=>`【${entry.equip.name}】`).join("、"):"无";
    document.getElementById("lootContent").innerHTML=`<div class="drop-recommendation">已将【${action.newEquip.name}】装备至${getSlotLabel(action.slotIdx)}；将卸下：${removed}。确认后进入下一阶段。</div><div class="loot-choice">${equipmentCardHtml(action.newEquip,true)}</div><div class="modal-actions"><button class="choice-btn" onclick="afterEquip()">确认选择，继续冒险</button><button class="choice-btn" onclick="undoEquip()">反悔，重新选择</button></div>`;
}
function undoEquip(){
    if(!lastEquipAction)return;
    let act=lastEquipAction;
    player.slots=act.previousSlots;
    applyEquipStats();
    refreshStatPanel();
    lastEquipAction=null;
    if(pendingLoot){
        renderLootChoice();
    }else{
        afterEquip();
    }
}
function showLootChoice(e1,e2,source){
    cancelLootAutoSelect();
    pendingLoot={e1,e2,source};
    lootDeferred=false;
    lastEquipAction=null;
    printEventSummary("战利品已掉落","已打开装备选择弹窗；确认或放弃后将自动收起这条记录。");
    clearChoices();
    document.getElementById("lootOverlay").hidden=false;
    renderLootChoice();
    autoSaveRun();
}
function renderLootChoice(){
    if(!pendingLoot)return;
    cancelLootAutoSelect();
    document.getElementById("lootTitle").textContent=pendingLoot.source==="bossLoot"?"角落遗落装备":"战利品选择";
    let drops=[pendingLoot.e1,pendingLoot.e2];
    let advice=getDropAdvice(drops),hasInferior=advice.inferiorIndexes.length>0;
    let adviceText=hasInferior?"无特殊词条且基础属性全面不占优的装备已标红；其余装备请按当前构筑与词条自行选择。":"两件装备各有取舍，请按输出、生存与特殊词条自行选择。";
    document.getElementById("lootContent").innerHTML=`<div class="drop-advice">${adviceText}</div><label class="toggle pixel-switch loot-auto-toggle"><input id="lootAutoSelect" type="checkbox" ${lootAutoSelectEnabled?"checked":""} onchange="toggleLootAutoSelect(this.checked)">自动选择装备 <span id="lootAutoStatus"></span></label><div class="loot-grid">${drops.map((item,index)=>{let inferior=advice.inferiorIndexes.includes(index);return `<article class="loot-choice ${inferior?"is-inferior":""}" data-loot-index="${index+1}"><h3>装备${index+1}${inferior?` <span class="loot-status">· 不建议</span>`:""}</h3>${equipmentCardHtml(item,true)}<button class="choice-btn" onclick="chooseLoot(${index+1})">选择装备${index+1}</button></article>`;}).join("")}</div><div class="modal-actions"><button class="choice-btn" onclick="deferLootChoice()">暂时收起</button><button class="choice-btn danger" onclick="declineLoot()">都放弃</button></div>`;
    syncLootAutoSelectControls();
    updateLootAutoStatus();
    if(lootAutoSelectEnabled)startLootAutoSelect();
}
function cancelLootAutoSelect(){
    if(lootAutoSelectTimer!==null){clearInterval(lootAutoSelectTimer);lootAutoSelectTimer=null;}
    document.querySelectorAll("#lootContent .auto-select-target").forEach(card=>card.classList.remove("auto-select-target"));
    lootAutoSelectToken++;
    lootAutoSelectRemaining=0;
}
function updateLootAutoStatus(){
    let status=document.getElementById("lootAutoStatus");
    if(!status)return;
    let best=getRecommendedLootChoice(),action=best&&best.comparison.score>0?"自动选择推荐装备":"自动放弃本次装备";
    status.textContent=lootAutoSelectRemaining>0?`${lootAutoSelectRemaining} 秒后${action}`:`开启后 5 秒${action}`;
}
function isLootAutoSelectReady(){
    if(!lootAutoSelectEnabled||!pendingLoot||lootDeferred||document.getElementById("lootOverlay").hidden)return false;
    return ["settingsOverlay","shopOverlay","saveOverlay","setOverlay","difficultyOverlay"].every(id=>document.getElementById(id).hidden);
}
function resumeLootAutoSelectIfReady(){
    if(isLootAutoSelectReady())startLootAutoSelect();
}
function startLootAutoSelect(){
    cancelLootAutoSelect();
    if(!isLootAutoSelectReady())return;
    let token=lootAutoSelectToken;
    lootAutoSelectRemaining=5;
    updateLootAutoStatus();
    lootAutoSelectTimer=setInterval(()=>{
        if(token!==lootAutoSelectToken||!lootAutoSelectEnabled||!pendingLoot||lootDeferred||document.getElementById("lootOverlay").hidden){cancelLootAutoSelect();return;}
        lootAutoSelectRemaining--;
        updateLootAutoStatus();
        if(lootAutoSelectRemaining===4)flashRecommendedLootChoice();
        if(lootAutoSelectRemaining<=0){
            cancelLootAutoSelect();
            autoResolveLootChoice();
        }
    },1000);
}
function getRecommendedLootChoice(){
    if(!pendingLoot)return null;
    let candidates=[pendingLoot.e1,pendingLoot.e2].map((item,index)=>({item,chosenIdx:index+1,comparison:getEquipmentComparisons(item)[0]})).filter(candidate=>candidate.comparison);
    if(!candidates.length)return null;
    return candidates.length===1||candidates[0].comparison.score>=candidates[1].comparison.score?candidates[0]:candidates[1];
}
function flashRecommendedLootChoice(){
    if(!lootAutoSelectEnabled||!pendingLoot)return;
    let best=getRecommendedLootChoice();
    let card=best&&best.comparison.score>0?document.querySelector(`#lootContent [data-loot-index="${best.chosenIdx}"]`):null;
    if(card)card.classList.add("auto-select-target");
}
function autoResolveLootChoice(){
    let best=getRecommendedLootChoice();
    if(best&&best.comparison.score>0)autoEquipRecommendedLoot();
    else autoDeclineLoot();
}
function autoEquipRecommendedLoot(){
    if(!pendingLoot)return;
    cancelLootAutoSelect();
    let best=getRecommendedLootChoice();
    if(!best||best.comparison.score<=0){autoDeclineLoot();return;}
    let action=best.comparison.action;
    lastEquipAction={...action,chosenIdx:best.chosenIdx,previousSlots:player.slots.slice()};
    player.slots=action.slots;
    applyEquipStats();
    refreshStatPanel();
    let result=action.removed.length?`卸下${action.removed.map(entry=>`【${entry.equip.name}】`).join("、")}`:`装备至空${getSlotLabel(action.slotIdx)}`;
    afterEquip(`已自动选择推荐装备【${best.item.name}】并${result}，继续冒险。`);
}
function autoDeclineLoot(){
    if(!pendingLoot)return;
    cancelLootAutoSelect();
    afterEquip("两件装备都没有正收益，已自动放弃本次掉落，继续冒险。");
}
function toggleLootAutoSelect(enabled){
    lootAutoSelectEnabled=Boolean(enabled);
    syncLootAutoSelectControls();
    if(lootAutoSelectEnabled)startLootAutoSelect();
    else{cancelLootAutoSelect();updateLootAutoStatus();}
}
function syncLootAutoSelectControls(){
    for(let id of ["lootAutoSelect","settingsLootAutoSelect"]){let control=document.getElementById(id);if(control)control.checked=lootAutoSelectEnabled;}
}
function chooseLoot(chosenIdx){
    cancelLootAutoSelect();
    if(pendingLoot)equipToSlot(chosenIdx===1?pendingLoot.e1:pendingLoot.e2,chosenIdx);
}
function deferLootChoice(){
    if(!pendingLoot)return;
    cancelLootAutoSelect();
    lootDeferred=true;
    document.getElementById("lootOverlay").hidden=true;
    printEventSummary("战利品已暂存","可从右侧勇者面板继续选择装备。");
    refreshStatPanel();
    autoSaveRun();
}
function resumeLootChoice(){
    if(!pendingLoot)return;
    cancelLootAutoSelect();
    lootDeferred=false;
    document.getElementById("lootOverlay").hidden=false;
    renderLootChoice();
    autoSaveRun();
}
function declineLoot(){
    cancelLootAutoSelect();
    afterEquip("已放弃本次掉落，继续冒险。");
}

function afterEquip(settledMessage=""){
    cancelLootAutoSelect();
    let settled=settledMessage||(lastEquipAction?`已确认装备【${lastEquipAction.newEquip.name}】，继续冒险。`:"战利品选择已完成，继续冒险。");
    pendingLoot=null;
    lastEquipAction=null;
    lootDeferred=false;
    document.getElementById("lootOverlay").hidden=true;
    printEventSummary("战利品结算",settled);
    collapseTerminalEvents();
    healPlayer(player.maxHp,"战后整备");
    let sg=countTrait("shieldGain");
    if(sg>0){
        let totalShield=0;
        for(let s of player.slots){if(s&&s.traits){for(let trait of s.traits){if(trait.id==="shieldGain")totalShield+=trait.value||0;}}}
        normalizeCombatant(player);player.shields.persistent=Math.max(player.shields.persistent,totalShield);player.ZDYHP=player.shields.temp+player.shields.persistent;player.shield=player.ZDYHP;
        print(`【护盾之核】获得${totalShield}点持续盾！`);
    }
    refreshStatPanel();
    if(gameState==="loot"){nextWave();}
    else if(gameState==="bossLoot"){enterBoss();}
}

function genEnemy(isBoss,bossType){
    let diffMult=Math.pow(1.4,save.useBlood);
    if(isBoss){
        let bossTraits=[];
        if(save.useBlood>=10){for(let index=0,count=Math.random()<0.5?1:2;index<count;index++){let candidates=enemyTraitList.filter(trait=>!bossTraits.some(existing=>existing.id===trait.id));if(candidates.length)bossTraits.push(pick(candidates));}}
        if(bossType==="魔王"){
            enemy=normalizeCombatant({name:"魔王",atk:Math.floor(2000*diffMult),hp:Math.floor(200000*diffMult),maxHp:Math.floor(200000*diffMult),tracking:.12,dodge:bossTraits.some(trait=>trait.id==="dodge")?0.20:0.08,armor:bossTraits.some(trait=>trait.id==="armor")?0.30:0.18,hits:3,traits:bossTraits,shield:0,dots:[],firstStrikeUsed:false,antiHealTurns:0,purifyTurns:0,purifyPenalty:0});
        }else{
            let hp=Math.floor(300000*diffMult*(1+save.useBlood*0.4));
            enemy=normalizeCombatant({name:"它",atk:Math.floor(3000*diffMult),hp,maxHp:hp,tracking:.18,dodge:bossTraits.some(trait=>trait.id==="dodge")?0.20:0.12,armor:bossTraits.some(trait=>trait.id==="armor")?0.30:0.25,hits:4,traits:bossTraits,shield:0,dots:[],firstStrikeUsed:false,antiHealTurns:0,purifyTurns:0,purifyPenalty:0});
        }
        prepareBattleShields();
        for(let trait of bossTraits)print(`【BOSS特性】${bossType}拥有【${trait.name}】：${trait.desc}`);
        return true;
    }
    let wave=player.wave;
    let baseAtk=Math.floor((50+wave*15)*(0.5+Math.random()*1.0));
    let baseHp=Math.floor((300+wave*80)*(0.5+Math.random()*1.0));
    if(wave>=7){
        if(player.job==="战士")baseHp=Math.floor(baseHp*rand(4,6));
        else if(player.job==="勇者")baseHp=Math.floor(baseHp*rand(3,5));
    }
    let eTraits=[];
    let eTraitProb=0.15+Math.min(1,wave/20)*0.15;
    if(save.useBlood>=6)eTraitProb*=1.5;
    let maxTraits=save.useBlood>=4?3:1;
    let tried={};
    for(let t=0;t<maxTraits;t++){
        if(Math.random()<eTraitProb){
            let candidates=enemyTraitList.filter(x=>!tried[x.id]);
            if(candidates.length>0){
                let picked=candidates[Math.floor(Math.random()*candidates.length)];
                tried[picked.id]=true;
                eTraits.push(picked);
            }
        }
    }
    if(save.useBlood>=8&&eTraits.length===0){
        let picked=enemyTraitList[Math.floor(Math.random()*enemyTraitList.length)];
        eTraits.push(picked);
    }
    let eShield=0;
    if(eTraits.some(t=>t.id==="shield")){eShield=Math.floor((300+wave*80)*0.20*diffMult);}
    let eAtk=Math.floor(baseAtk*diffMult);
    if(eTraits.some(t=>t.id==="trueSight")){eAtk=Math.min(600,Math.floor(eAtk*0.50));}
    let enemyDodge=Math.max(eTraits.some(trait=>trait.id==="dodge")?0.20:0,Math.min(.28,.02+wave*.008));
    let enemyArmor=Math.max(eTraits.some(trait=>trait.id==="armor")?0.30:0,Math.min(.35,.04+wave*.012));
    enemy=normalizeCombatant({name:pick(monsterAdj)+pick(monsterNoun),atk:eAtk,hp:Math.floor(baseHp*diffMult),maxHp:Math.floor(baseHp*diffMult),tracking:Math.min(.30,.03+wave*.012+save.useBlood*.008),dodge:enemyDodge,armor:enemyArmor,hits:wave>=8?3:wave>=4?2:1,traits:eTraits,shield:eShield,dots:[],firstStrikeUsed:false,antiHealTurns:0,purifyTurns:0,purifyPenalty:0});
    if(enemy.hits>1)print(`【多段攻击】敌人每回合攻击${enemy.hits}段；每段独立判定。`);
    if(eTraits.length>0){for(let et of eTraits){print(`【敌人特性】这只敌人拥有【${et.name}】：${et.desc}`);}}
    if(hasTrait("stealGuard")){let shield=Math.floor(player.maxHp*.05);grantShield(player,"persistent",shield);print(`【防盗】装备受到保护，获得${shield}点持续盾！`);}
    prepareBattleShields();
    if(save.useBlood>=9&&Math.random()<0.30){
        let filled=[];
        for(let i=0;i<player.slots.length;i++){if(player.slots[i])filled.push(i);}
        if(filled.length>0){
            let ridx=filled[Math.floor(Math.random()*filled.length)];
            let lost=player.slots[ridx];
            player.slots[ridx]=null;
            applyEquipStats();
            refreshStatPanel();
            gameState="equipLostConfirm";
            print(`【难度${save.useBlood}】黑暗的力量侵蚀了你，你失去了一件装备：`);
            showEquip(lost);
            clearChoices();
            addChoice("确认",()=>{gameState="battle";battleLoop();});
            autoSaveRun();
            return false;
        }
    }
    return true;
}

function applyDots(){
    if(!enemy.dots||enemy.dots.length===0)return;
    let totalDot=0;
    let newDots=[];
    for(let d of enemy.dots){
        let dmg=0;
        if(d.type==="burn"){dmg=Math.floor(player.atk*0.20*d.stacks);}
        else if(d.type==="poison"){dmg=Math.floor(enemy.maxHp*0.03*d.stacks);}
        else if(d.type==="bleed"){dmg=Math.floor(enemy.hp*0.05*d.stacks);}
        totalDot+=dmg;
        d.turns--;
        if(d.turns>0)newDots.push(d);
    }
    enemy.dots=newDots;
    if(totalDot>0){
        totalDot=absorbDamage(enemy,totalDot,{label:"敌方持续盾"}).damage;
        if(totalDot>0){enemy.hp-=totalDot;showBattleFeedback("enemy",`持续 -${totalDot}`,"damage");print(`【持续伤害】敌人受到${totalDot}点持续伤害！`);}
    }
}
function addDot(type,name){
    if(!enemy.dots)enemy.dots=[];
    let existing=enemy.dots.find(d=>d.type===type);
    if(existing){existing.stacks=Math.min(5,existing.stacks+1);existing.turns=3;}
    else{enemy.dots.push({type,name,stacks:1,turns:3});}
    print(`【${name}】敌人陷入了${name}状态！`);
}
function playerAttack(){
    let dmg=Math.floor(player.atk*(0.85+Math.random()*0.30));
    if(player.energySurgeBoost){dmg=Math.floor(dmg*1.10);player.energySurgeBoost=false;print("【能量涌动】能量充盈，攻击+10%！");}
    let isCrit=false;
    let pmult=getTraitProbMult();
    if(player.defendStack>0){dmg=Math.floor(dmg*(1+0.5*player.defendStack));print(`【蓄力一击】伤害提升${50*player.defendStack}%！`);player.defendStack=0;}
    if(countTrait("firstStrike")>0&&!enemy.firstStrikeUsed){dmg=Math.floor(dmg*2);enemy.firstStrikeUsed=true;print("【先发制人】首次攻击伤害翻倍！");}
    let hh=countTrait("highHpBoost");
    if(hh>0&&player.hp/player.maxHp>0.8){dmg=Math.floor(dmg*(1+0.30*hh));print(`【全盛之势】血量高于80%，攻击+${30*hh}%！`);}
    let bz=countTrait("berserk");
    if(bz>0&&player.hp/player.maxHp<0.3){dmg=Math.floor(dmg*(1+0.50*bz));print(`【狂暴之力】血量低于30%，攻击+${50*bz}%！`);}
    if(player.blessing==="天使的祝福"){
        let hpRatio=player.hp/player.maxHp;
        dmg=Math.floor(dmg*(1+hpRatio*0.25));
    }
    if(player.job==="天使"){
        let hpBonus=Math.floor(player.maxHp/100)*0.01;
        dmg=Math.floor(dmg*(1+hpBonus));
    }
    if(player.blessing==="隐士的祝福"&&player.crt>1){
        dmg=Math.floor(dmg*(1+(player.crt-1)));
    }
    if(player.job==="隐士"&&player.crt>1){
        let excessCrt=player.crt-1;
        let dodgeBonus=Math.floor(excessCrt*100/5)*0.02;
        dmg=Math.floor(dmg*(1+dodgeBonus));
    }
    let ds=countTrait("deadlyStrike");
    let c20=countTrait("crit20x");
    if(ds>0&&Math.random()<0.05*ds*pmult){
        dmg=enemy.hp;
        print("【致命一击】你直接秒杀了敌人！");
    }else if(c20>0&&Math.random()<0.15*c20*pmult){
        dmg=Math.floor(player.atk*15);
        print("【会心一击】造成15倍伤害！");
    }else{
        if(Math.random()<player.bj){isCrit=true;dmg=Math.floor(dmg*player.bs);}
        if(player.nextDodgeBoost){dmg=Math.floor(dmg*10);player.nextDodgeBoost=false;print("【闪避反击】伤害变为10倍！");}
    }
    let ex=countTrait("execute");
    if(ex>0&&enemy.hp/enemy.maxHp<0.2){dmg=Math.floor(dmg*(1+1.0*ex));print(`【斩杀】敌人血量低于20%，伤害×${1+ex}！`);}
    if(hasSet("雷4")){
        let thunderDmg=Math.floor(enemy.hp*scaledElementEffect(0.06));
        dmg+=thunderDmg;
        print(`【雷电四件】额外造成${thunderDmg}点雷电伤害`);
    }else if(hasSet("雷2")){
        let thunderDmg=Math.floor(enemy.hp*scaledElementEffect(0.03));
        dmg+=thunderDmg;
        print(`【雷电两件】额外造成${thunderDmg}点雷电伤害`);
    }
    if(hasSet("火4")){dmg=Math.floor(dmg*(1+scaledElementEffect(0.25)));}
    else if(hasSet("火2")){dmg=Math.floor(dmg*(1+scaledElementEffect(0.10)));}
    if(hasTrait("trueStrike")){dmg=Math.floor(dmg*1.08);print("【必中打击】攻击无视闪避，伤害+8%。");}
    if(!hasTrait("trueStrike")&&Math.random()<enemy.dodge){
        showBattleFeedback("enemy","闪避","dodge");
        print(`【灵巧】敌人闪避了你的攻击！`);
        dmg=0;
    }
    let armorBreak=getArmorBreakValue();
    if(dmg>0&&armorBreak>0){dmg=Math.floor(dmg*(1+armorBreak));print(`【破甲】削减敌方护甲${Math.floor(armorBreak*100)}%。`);}
    if(dmg>0&&hasTrait("antiHeal")){dmg=Math.floor(dmg*1.05);}
    if(dmg>0&&hasTrait("shieldBash")&&shieldTotal(player)>0){dmg=Math.floor(dmg*1.25);print("【护盾猛击】伤害提升25%。");}
    if(dmg>0&&player.revengeActive){dmg=Math.floor(dmg*1.30);player.revengeActive=false;print("【复仇】伤害提升30%。");}
    if(dmg>0&&enemy.armor>0){let reduction=Math.max(0,enemy.armor-armorBreak);dmg=Math.floor(dmg*(1-reduction));if(reduction>0)print(`【护甲】敌人的护甲减免了${Math.floor(reduction*100)}%伤害！`);}
    if(dmg>0&&save.useBlood>=7){dmg=Math.floor(dmg*0.80);}
    if(dmg>0)dmg=absorbDamage(enemy,dmg,{label:"敌方护盾"}).damage;
    if(dmg>0&&hasETrait("thorns")&&!hasTrait("antiThorns")){
        let reflect=Math.floor(dmg*0.15);
        player.hp-=reflect;
        showBattleFeedback("player",`反伤 -${reflect}`,"damage");
        print(`【荆棘之甲】你受到${reflect}点反伤！`);
    }
    if(dmg>0&&hasETrait("thorns")&&hasTrait("antiThorns"))print("【反刺护体】免疫荆棘反伤。");
    enemy.hp-=dmg;
    showBattleFeedback("enemy",dmg>0?(isCrit?`暴击 -${dmg}`:`-${dmg}`):"格挡",isCrit?"crit":(dmg>0?"attack":"damage"));
    if(dmg>0&&hasETrait("enrage")&&enemy.hp>0){
        enemy.atk=Math.floor(enemy.atk*1.10);
        print(`【激怒】敌人的攻击力提升了！`);
    }
    if(isCrit&&hasTrait("critExecute")&&enemy.hp/enemy.maxHp<0.30){enemy.hp=0;print("【暴击斩杀】直接斩杀敌人！");}
    else if(isCrit)print(`你暴击造成 ${dmg} 点伤害！`);
    else print(`你造成 ${dmg} 点伤害`);
    if(player.job==="战士"){
        let heal=Math.floor(dmg*0.20);
        healPlayer(heal,"战士吸血");
    }
    if(player.blessing==="战士的祝福"){
        let heal=Math.floor(player.maxHp*0.03);
        healPlayer(heal,"战士祝福");
    }
    let ah=countTrait("attackHeal");
    if(ah>0){
        let heal=Math.floor(player.maxHp*0.03*ah);
        healPlayer(heal,"生命汲取");
    }
    let ch=countTrait("critHeal");
    if(isCrit&&ch>0){
        let heal=Math.floor(player.maxHp*0.10*ch);
        healPlayer(heal,"吸血暴击");
    }
    let ce=countTrait("critEnergy");
    if(isCrit&&ce>0){
        player.energy=Math.min(100,player.energy+10*ce);
        print(`【暴击充能】额外获得${10*ce}点能量！`);
    }
    player.energy=Math.min(100,player.energy+15);
    let es=countTrait("energySurge");
    if(es>0){player.energy=Math.min(100,player.energy+8*es);if(player.energy>=100)player.energySurgeBoost=true;}
    if(player.energy>=100&&hasTrait("energyShield")&&shieldTotal(player)<player.maxHp*.2){grantShield(player,"temp",Math.floor(player.maxHp*.2));print("【能量护盾】获得临时盾。");}
    if(dmg>0&&hasTrait("antiHeal")){enemy.antiHealTurns=2;print("【禁疗】敌人两回合无法回复。");}
    if(dmg>0&&hasTrait("purify")&&Math.random()<0.5){if(enemy.purifyPenalty)enemy.atk+=enemy.purifyPenalty;enemy.purifyPenalty=Math.max(1,Math.floor(enemy.atk*0.15));enemy.atk=Math.max(1,enemy.atk-enemy.purifyPenalty);enemy.purifyTurns=2;print("【净化】敌人攻击力降低15%，持续2回合。");}
    if(countTrait("burn")>0&&!enemy.dots.find(d=>d.type==="burn"&&d.stacks>=5)){addDot("burn","烈焰灼烧");}
    if(countTrait("poison")>0&&!enemy.dots.find(d=>d.type==="poison"&&d.stacks>=5)){addDot("poison","剧毒腐蚀");}
    if(countTrait("bleed")>0&&!enemy.dots.find(d=>d.type==="bleed"&&d.stacks>=5)){addDot("bleed","撕裂流血");}
    let cs=countTrait("critShield");
    if(isCrit&&cs>0){
        let shield=Math.floor(player.maxHp*0.05*cs);
        grantShield(player,"temp",shield);print(`【暴击护盾】获得${shield}点临时盾！`);
    }
    let ls=countTrait("lifesteal");
    if(ls>0){
        let heal=Math.floor(dmg*0.10*ls);
        healPlayer(heal,"生命汲取·强");
    }
    refreshStatPanel();
    let dbl=countTrait("doubleStrike");
    if(dbl>0&&Math.random()<0.20*dbl&&enemy.hp>0){
        print("【连击】你追加了一次攻击！");
        let dmg2=Math.floor(player.atk*(0.85+Math.random()*0.30)),isCrit2=false;
        if(!hasTrait("trueStrike")&&Math.random()<enemy.dodge){dmg2=0;print("【灵巧】敌人闪避了追加攻击！");}
        if(dmg2>0&&Math.random()<player.bj){isCrit2=true;dmg2=Math.floor(dmg2*player.bs);print(`连击暴击造成 ${dmg2} 点伤害！`);}
        let armorBreak=getArmorBreakValue();
        if(dmg2>0)dmg2=Math.floor(dmg2*(1-Math.max(0,enemy.armor-armorBreak)));
        if(dmg2>0&&save.useBlood>=7)dmg2=Math.floor(dmg2*.80);
        if(dmg2>0)dmg2=absorbDamage(enemy,dmg2,{label:"敌方护盾"}).damage;
        if(dmg2>0&&!isCrit2)print(`连击造成 ${dmg2} 点伤害`);
        enemy.hp-=dmg2;
        showBattleFeedback("enemy",`连击 -${dmg2}`,"damage");
        if(dmg2>0&&hasETrait("enrage")&&enemy.hp>0){enemy.atk=Math.floor(enemy.atk*1.10);print("【激怒】敌人的攻击力提升了！");}
    }
}
function burstAttack(){
    player.energy=0;
    let dmg=Math.floor(player.atk*5*(0.9+Math.random()*0.2));
    if(player.blessing==="天使的祝福"){
        let hpRatio=player.hp/player.maxHp;
        dmg=Math.floor(dmg*(1+hpRatio*0.25));
    }
    if(player.job==="天使"){
        let hpBonus=Math.floor(player.maxHp/100)*0.01;
        dmg=Math.floor(dmg*(1+hpBonus));
    }
    if(player.blessing==="隐士的祝福"&&player.crt>1){
        dmg=Math.floor(dmg*(1+(player.crt-1)));
    }
    if(player.job==="隐士"&&player.crt>1){
        let excessCrt=player.crt-1;
        let dodgeBonus=Math.floor(excessCrt*100/5)*0.02;
        dmg=Math.floor(dmg*(1+dodgeBonus));
    }
    if(hasSet("雷4")){
        let thunderDmg=Math.floor(enemy.hp*scaledElementEffect(0.06));
        dmg+=thunderDmg;
        print(`【雷电四件】额外造成${thunderDmg}点雷电伤害`);
    }else if(hasSet("雷2")){
        let thunderDmg=Math.floor(enemy.hp*scaledElementEffect(0.03));
        dmg+=thunderDmg;
        print(`【雷电两件】额外造成${thunderDmg}点雷电伤害`);
    }
    if(hasSet("火4")){dmg=Math.floor(dmg*(1+scaledElementEffect(0.25)));}
    else if(hasSet("火2")){dmg=Math.floor(dmg*(1+scaledElementEffect(0.10)));}
    if(hasTrait("trueStrike")){dmg=Math.floor(dmg*1.08);print("【必中打击】必杀技无视闪避，伤害+8%。");}
    if(!hasTrait("trueStrike")&&Math.random()<enemy.dodge){
        showBattleFeedback("enemy","闪避必杀","dodge");
        print(`【灵巧】敌人闪避了你的必杀技！`);
        dmg=0;
    }
    let armorBreak=getArmorBreakValue();
    if(dmg>0&&armorBreak>0)print(`【破甲】必杀技削减敌方护甲${Math.floor(armorBreak*100)}%。`);
    if(dmg>0&&enemy.armor>0){let reduction=Math.max(0,enemy.armor-armorBreak);dmg=Math.floor(dmg*(1-reduction));if(reduction>0)print(`【护甲】敌人的护甲减免了${Math.floor(reduction*100)}%必杀技伤害！`);}
    if(dmg>0&&save.useBlood>=7){dmg=Math.floor(dmg*0.80);}
    if(dmg>0)dmg=absorbDamage(enemy,dmg,{label:"敌方护盾"}).damage;
    if(dmg>0&&hasETrait("thorns")&&!hasTrait("antiThorns")){
        let reflect=Math.floor(dmg*0.15);
        player.hp-=reflect;
        showBattleFeedback("player",`反伤 -${reflect}`,"damage");
        print(`【荆棘之甲】你受到${reflect}点反伤！`);
    }
    enemy.hp-=dmg;
    showBattleFeedback("enemy",dmg>0?`必杀 -${dmg}`:"格挡","crit");
    if(dmg>0&&hasETrait("enrage")&&enemy.hp>0){
        enemy.atk=Math.floor(enemy.atk*1.10);
        print(`【激怒】敌人的攻击力提升了！`);
    }
    print(`【必杀技】你释放了必杀技，造成 ${dmg} 点伤害！`);
    refreshStatPanel();
}

function getPlayerDodgeAgainst(unit){return Math.min(.95,Math.max(0,player.crt-(Number(unit.tracking)||0)));}
function getEnemySegmentAttack(unit,hits){let count=Math.max(1,hits|0),turnScale=1+.12*(count-1);return Math.max(1,Math.floor(unit.atk*turnScale/count));}
function applyEnemyDotDamage(part,hits){
    if(!hasETrait("dot"))return;
    let dotDmg=Math.floor(getEnemySegmentAttack(enemy,hits)*.15);
    if(hasTrait("dotResist"))dotDmg=Math.floor(dotDmg*.5);
    dotDmg=absorbDamage(player,dotDmg,{label:`剧毒第${part}段`}).damage;
    if(dotDmg>0){player.hp-=dotDmg;print(`【剧毒之体】第${part}/${hits}段附加${dotDmg}点无法闪避的持续伤害！`);}
}
function tryPlayerRevive(){
    if(player.hp>0)return true;
    let pmult=getTraitProbMult(),reviveOnce=countTrait("reviveOnce");
    if(reviveOnce>0&&player.ZBSPECIALUSED1<reviveOnce){player.hp=0;player.ZBSPECIALUSED1++;healPlayer(Math.floor(player.maxHp*.5),"不死意志");print(`【不死意志】剩余${reviveOnce-player.ZBSPECIALUSED1}次。`);return player.hp>0;}
    let revive30=countTrait("revive30");
    if(revive30>0&&Math.random()<.30*revive30*pmult){player.hp=1;print("【苟延残喘】你保留了1点生命！");return true;}
    return false;
}
function tryEnemyTheft(){
    if(!hasETrait("thief"))return true;
    if(hasTrait("stealGuard")){print("【防盗】你的装备受到保护，小偷未能得逞！");return true;}
    if(Math.random()>=.25)return true;
    let filled=[];
    for(let i=0;i<player.slots.length;i++)if(player.slots[i])filled.push(i);
    if(!filled.length)return true;
    let ridx=pick(filled),stolen=player.slots[ridx];player.slots[ridx]=null;
    applyEquipStats();refreshStatPanel();gameState="equipLostConfirm";
    print("【小偷】敌人偷走了你的装备：");showEquip(stolen);clearChoices();
    addChoice("确认",()=>{gameState="battle";battleLoop();});autoSaveRun();return false;
}
function settleEnemyTurn(){
    if(hasPrismaticResonance()&&player.hp>0&&enemy.hp>0){let cap=Math.max(1,Math.floor(player.maxHp*.08)),restored=restoreTemporaryShield(player,Math.max(1,Math.floor(player.maxHp*.02)),cap);if(restored>0)print(`【四色共鸣】自然临时盾恢复${restored}点。`);}
    if(hasETrait("heal")&&enemy.hp>0&&!(enemy.antiHealTurns>0)){let healed=Math.floor(enemy.maxHp*.05);enemy.hp=Math.min(enemy.maxHp,enemy.hp+healed);print(`【再生】敌人回复了${healed}点生命值！`);}
    if(enemy.antiHealTurns>0)enemy.antiHealTurns--;
    if(enemy.purifyTurns>0){enemy.purifyTurns--;if(enemy.purifyTurns===0&&enemy.purifyPenalty){enemy.atk+=enemy.purifyPenalty;enemy.purifyPenalty=0;print("【净化】敌人的攻击力已恢复。");}}
    if(player.hp<=0||enemy.hp<=0)return true;
    return tryEnemyTheft();
}
function resolveEnemyAttackSegment(part,hits){
    let effCrt=getPlayerDodgeAgainst(enemy);
    if(hasTrait("secondWind")&&player.hp/player.maxHp<0.2){effCrt+=0.30;print("【背水一战】闪避率提升30%。");}
    effCrt=Math.min(.95,Math.max(0,effCrt));
    if(hasETrait("trueSight")){effCrt=0;print("【真实之眼】敌人的攻击完全无视你的闪避！");}
    else if(hasETrait("phase")&&Math.random()<0.50){effCrt=0;print("【相位】敌人的攻击穿透了你的闪避！");}
    if(enemy.name==="魔王"&&Math.random()<0.05){effCrt=effCrt*0.5;print("【魔王】魔王的攻势凌厉，你的闪避率减半！");}
    if(Math.random()<effCrt){
        showBattleFeedback("player","闪避","dodge");
        print(`第${part}/${hits}段：你以${Math.floor(effCrt*100)}%有效闪避避开攻击（敌方追踪${Math.floor((enemy.tracking||0)*100)}%）。`);
        if(hasTrait("dodgeBoost")){player.nextDodgeBoost=true;print("【闪避反击】下次攻击伤害变为10倍！");}
        let dh=countTrait("dodgeHeal");
        if(dh>0)healPlayer(Math.floor(player.maxHp*.05*dh),"灵动自愈");
        applyEnemyDotDamage(part,hits);
        return tryPlayerRevive();
    }
    let dmg=Math.floor(getEnemySegmentAttack(enemy,hits)*(0.8+Math.random()*0.40));
    if(hasETrait("rage")&&enemy.hp/enemy.maxHp<0.5){
        dmg=Math.floor(dmg*1.50);
        print(`【狂暴】敌人血量低于50%，攻击力提升50%！`);
    }
    if(hasETrait("crit")&&Math.random()<0.25){
        dmg=Math.floor(dmg*1.5);
        print(`【致命】敌人造成了1.5倍伤害！`);
    }
    if(save.useBlood>=5){dmg=Math.floor(dmg*0.90);}
    let otherReduction=countTrait("ironWall")*.15+(hasTrait("antiThorns")?0.05:0)+(hasTrait("dotResist")?0.05:0)+(hasSet("水4")?scaledElementEffect(0.20):hasSet("水2")?scaledElementEffect(0.08):0);
    let resonanceReduction=hasPrismaticResonance()?0.12:0;
    let beforeResonance=Math.floor(dmg*Math.max(.10,1-otherReduction));
    dmg=Math.floor(dmg*Math.max(.10,1-otherReduction-resonanceReduction));
    if(resonanceReduction>0)print(`【四色共鸣】本次受击额外减免${Math.floor(resonanceReduction*100)}%，具体减免${Math.max(0,beforeResonance-dmg)}点伤害。`);
    let isPierce=hasETrait("pierce");
    dmg=absorbDamage(player,dmg,{pierce:isPierce,label:`第${part}段`}).damage;
    if(isPierce&&dmg>0){print("【隔山打牛】敌人的攻击无视了你的护盾！");}
    if(dmg>0){
        player.hp-=dmg;
        showBattleFeedback("player",`-${dmg}`,"damage");
        print(`第${part}/${hits}段：敌人造成 ${dmg} 点伤害。`);
        player.energy=Math.min(100,player.energy+10);
        if(hasTrait("revenge"))player.revengeActive=true;
        let th=countTrait("thorns");
        if(th>0){
            let reflect=Math.floor(dmg*0.10*th);
            enemy.hp-=reflect;
            print(`【荆棘反伤】反弹${reflect}点伤害给敌人！`);
        }
        if(player.job==="勇者"){
            let reflect=Math.floor(dmg*0.15);
            enemy.hp-=reflect;
            print(`【勇者】反弹${reflect}点伤害给敌人！`);
        }
        if(hasETrait("lifesteal")){
            let heal=Math.floor(dmg*0.20);
            enemy.hp=Math.min(enemy.maxHp,enemy.hp+heal);
            print(`【嗜血】敌人回复了${heal}点生命值！`);
        }
        if(hasETrait("weaken")){
            let v=Math.max(1,Math.floor(player.atk*rand(3,5)/100));
            player.atk=Math.max(1,player.atk-v);
            print(`【虚弱】你的攻击力降低了${v}点！`);
        }
        if(hasETrait("curse")){
            let v=rand(1,3)/100;
            player.bj=Math.max(0,player.bj-v);
            print(`【诅咒】你的暴击率降低了${Math.floor(v*1000)/10}%！`);
        }
    }
    applyEnemyDotDamage(part,hits);
    return tryPlayerRevive();
}

function enemyAttack(){
    normalizeCombatant(player);normalizeCombatant(enemy);
    let hits=Math.max(1,enemy.hits);
    if(enemy.name==="它"){
        let key=pick(["atk","maxHp","bj","bs","crt"]),amount=key==="maxHp"?rand(3,8):key==="atk"?rand(1,2):key==="bs"?rand(5,15)/1000:rand(3,8)/1000;
        player[key]=Math.max(key==="atk"||key==="maxHp"?1:0,player[key]-amount);if(key==="maxHp")player.hp=Math.min(player.hp,player.maxHp);
        let labels={atk:"攻击力",maxHp:"血量上限",bj:"暴击率",bs:"暴击伤害",crt:"闪避率"};
        print(`【它的侵蚀】${labels[key]}-${key==="bj"||key==="bs"||key==="crt"?`${Math.floor(amount*1000)/10}%`:amount}`);
    }
    if(hasETrait("berserker")&&enemy.hp>0&&Math.random()<.35){hits++;let selfDmg=Math.floor(enemy.maxHp*.10);enemy.hp-=selfDmg;print(`【战狂】本回合追加第${hits}段攻击，并损失${selfDmg}点生命值！`);}
    for(let part=1;part<=hits&&player.hp>0&&enemy.hp>0;part++)if(!resolveEnemyAttackSegment(part,hits))break;
    let continued=settleEnemyTurn();refreshStatPanel();return continued;
}

function autoBattleDecide(){
    let chargedAttack=player.atk*(1+0.5*(player.defendStack||0));
    if(enemy.hp<=chargedAttack)return "attack";
    if(player.energy>=100)return "burst";
    if((player.defendStack||0)>=2)return "attack";
    let dodgeRate=hasETrait("trueSight")?0:getPlayerDodgeAgainst(enemy);
    if(hasETrait("phase"))dodgeRate*=.5;
    let incoming=enemy.atk*(1+.12*(Math.max(1,enemy.hits)-1))*(1-dodgeRate);
    let otherReduction=countTrait("ironWall")*.15+(hasTrait("antiThorns")?0.05:0)+(hasTrait("dotResist")?0.05:0)+(hasSet("水4")?scaledElementEffect(0.20):hasSet("水2")?scaledElementEffect(0.08):0);
    let resonanceReduction=hasPrismaticResonance()?0.12:0;
    incoming*=Math.max(.10,1-otherReduction-resonanceReduction);
    let healing=0;
    if(player.job==="战士")healing+=player.atk*0.20*(1-dodgeRate);
    if(player.blessing==="战士的祝福")healing+=player.maxHp*0.03;
    healing+=countTrait("attackHeal")*player.maxHp*0.03;
    healing+=countTrait("lifesteal")*chargedAttack*0.10;
    let effectiveHp=player.hp+shieldTotal(player);
    let turnsToDie=Math.ceil(effectiveHp/Math.max(1,incoming-healing));
    let turnsToKill=Math.ceil(enemy.hp/Math.max(1,chargedAttack));
    return turnsToDie<=turnsToKill+1?"defend":"attack";
}
function doDefend(){
    if((player.defendStack||0)>=2){print("蓄力已达上限（2层），请攻击释放蓄力。");battleLoop();return;}
    player.defendStack=(player.defendStack||0)+1;
    print(`你选择防御，伤害减少90%，积蓄能量，蓄力层数+1（当前${player.defendStack}/2层）。`);
    player.energy=Math.min(100,player.energy+25);
    let originalAtk=enemy.atk;
    enemy.atk=Math.floor(originalAtk*0.1);
    let continued=enemyAttack();
    enemy.atk=originalAtk;
    if(!continued||player.hp<=0){if(player.hp<=0)onPlayerDefeat();return;}
    battleLoop();
}

function doAttackRound(){
    if(gamePaused)return;
    if(autoBattle){let decision=autoBattleDecide();if(decision==="defend"){doDefend();return;}if(decision==="burst")burstAttack();else playerAttack();}
    else if(player.energy>=100)burstAttack();
    else playerAttack();
    if(enemy.hp<=0){onEnemyDefeat();return;}
    applyDots();
    if(enemy.hp<=0){onEnemyDefeat();return;}
    if(!enemyAttack())return;
    if(player.hp<=0){onPlayerDefeat();return;}
    if(autoBattle){scheduleAutoBattleStep(battleLoop);}
    else{battleLoop();}
}
function simulateBossSkip(){
    print("\n=== 快速模拟最终决战 ===");
    let avgDmg=player.atk;
    avgDmg=avgDmg*(1+Math.min(1,player.bj)*(player.bs-1));
    if(hasSet("火4"))avgDmg*=1+scaledElementEffect(0.25);else if(hasSet("火2"))avgDmg*=1+scaledElementEffect(0.10);
    let thunderDot=0;
    if(hasSet("雷4"))thunderDot=enemy.maxHp*scaledElementEffect(0.06);else if(hasSet("雷2"))thunderDot=enemy.maxHp*scaledElementEffect(0.03);
    avgDmg+=thunderDot;
    let burstEvery=100/15;
    avgDmg+=(player.atk*5)/burstEvery;
    if(player.job==="天使"){avgDmg*=(1+Math.floor(player.maxHp/100)*0.01);}
    if(player.job==="隐士"&&player.crt>1){avgDmg*=(1+Math.floor((player.crt-1)*100/5)*0.02);}
    if(player.blessing==="天使的祝福"){avgDmg*=(1+(player.hp/player.maxHp)*0.25);}
    if(player.blessing==="隐士的祝福"&&player.crt>1){avgDmg*=(1+(player.crt-1));}
    let bossDmg=enemy.atk*(1+.12*(Math.max(1,enemy.hits)-1));
    let effCrt=getPlayerDodgeAgainst(enemy);
    if(enemy.name==="魔王"){effCrt=effCrt*0.95+effCrt*0.5*0.05;}
    bossDmg*=(1-effCrt);
    let bossWaterReduction=hasSet("水4")?scaledElementEffect(0.20):hasSet("水2")?scaledElementEffect(0.08):0;
    bossDmg*=Math.max(.10,1-bossWaterReduction-(hasPrismaticResonance()?0.12:0));
    let iw=countTrait("ironWall");
    if(iw>0)bossDmg*=Math.max(0.1,1-0.15*iw);
    let healPerTurn=0;
    if(player.job==="战士")healPerTurn+=avgDmg*0.20;
    if(player.blessing==="战士的祝福")healPerTurn+=player.maxHp*0.03;
    let ah=countTrait("attackHeal");
    if(ah>0)healPerTurn+=player.maxHp*0.03*ah;
    let ls=countTrait("lifesteal");
    if(ls>0)healPerTurn+=avgDmg*0.10*ls;
    let ch=countTrait("critHeal");
    if(ch>0)healPerTurn+=player.maxHp*0.10*ch*Math.min(1,player.bj);
    let totalHp=player.maxHp+shieldTotal(player);
    let turnsToKill=enemy.maxHp/avgDmg;
    let netLoss=Math.max(0,bossDmg-healPerTurn);
    let turnsSurvive=netLoss>0?totalHp/netLoss:9999;
    print(`玩家每回合平均伤害：${Math.floor(avgDmg)}`);
    print(`BOSS每回合平均伤害：${Math.floor(bossDmg)}`);
    print(`玩家每回合平均回血：${Math.floor(healPerTurn)}`);
    print(`击杀BOSS需约 ${turnsToKill.toFixed(1)} 回合`);
    print(`玩家约能撑 ${turnsSurvive.toFixed(1)} 回合`);
    if(turnsToKill<=turnsSurvive){
        print("模拟结果：你成功击败了BOSS！");
        enemy.hp=0;
        onEnemyDefeat();
    }else{
        print("模拟结果：你力竭倒下了……");
        player.hp=0;
        onPlayerDefeat();
    }
}
function battleLoop(){
    if(gamePaused)return;
    cancelAutoBattleStep();
    if(enemy.hp<=0){onEnemyDefeat();return;}
    if(player.hp<=0){onPlayerDefeat();return;}
    autoSaveRun();
    refreshStatPanel();
    clearChoices();
    print(`\n【${enemy.name}】 ATK:${enemy.atk} HP: ${Math.max(0,enemy.hp)}/${enemy.maxHp} | 能量: ${player.energy}/100`);
    if(autoBattle){
        addChoice("停止自动战斗",()=>{setAutoBattle(false);print("已停止自动战斗。");battleLoop();},"btn-danger");
        scheduleAutoBattleStep(doAttackRound);
        return;
    }
    addChoice("攻击",()=>doAttackRound());
    addChoice("防御",()=>doDefend());
    if(player.energy>=100){
        addChoice("必杀技",()=>{burstAttack();if(enemy.hp<=0){onEnemyDefeat();return;}applyDots();if(enemy.hp<=0){onEnemyDefeat();return;}if(!enemyAttack())return;if(player.hp<=0){onPlayerDefeat();return;}battleLoop();});
    }
    addChoice("自动战斗",()=>{setAutoBattle(true);print("自动战斗开启，将持续攻击直到战斗结束。");battleLoop();});
    if(gameState==="bossBattle"){
        addChoice("一键跳过最终决战",()=>{simulateBossSkip();},"btn-danger");
    }
    addChoice("逃跑",()=>{if(Math.random()<0.3){print("你成功逃跑了！");gameState="badEnd";badEnd(1);}else{print("逃跑失败！");if(!enemyAttack())return;if(player.hp<=0){onPlayerDefeat();return;}battleLoop();}});
}

function playEnemyDefeatAnimation(onComplete){
    let enemyArea=document.getElementById("enemyBarArea"),event=document.getElementById("battleEvent");
    if(preferences.reduceMotion||!enemyArea){onComplete();return;}
    defeatAnimating=true;
    clearChoices();
    if(event)event.textContent="敌人被击败";
    enemyArea.classList.remove("defeated");
    void enemyArea.offsetWidth;
    enemyArea.classList.add("defeated");
    setTimeout(()=>{enemyArea.classList.remove("defeated");defeatAnimating=false;onComplete();},620);
}
function onEnemyDefeat(){
    if(defeatAnimating)return;
    playEnemyDefeatAnimation(finishEnemyDefeat);
}
function rememberLastBattle(){lastBattleSnapshot=cloneForStorage({...enemy,hp:enemy.maxHp});}
function finishEnemyDefeat(){
    rememberLastBattle();
    if(hasETrait("explode")){
        let explodeDmg=Math.floor(player.maxHp*0.10);
        explodeDmg=absorbDamage(player,explodeDmg,{label:"爆裂冲击"}).damage;
        if(explodeDmg>0){player.hp-=explodeDmg;print(`【爆裂】敌人死亡时爆炸，你受到${explodeDmg}点伤害！`);}
    }
    print(`你击败了 【${enemy.name}】！`);
    let kh=countTrait("killHeal");
    if(kh>0){
        let heal=Math.floor(player.maxHp*0.30*kh);
        healPlayer(heal,"斩杀回复");
    }
    if(gameState==="bossBattle"){
        let baseGold=rand(100,200),gold=Math.floor(baseGold*getDifficultyGoldMultiplier());
        save.gold=(save.gold||0)+gold;
        print(`你获得了 ${gold} 枚金币（基础${baseGold} ×难度金币倍率${getDifficultyGoldMultiplier().toFixed(2)}，已取整）！当前：${save.gold}`);
        writeSave();
    }else{
        let baseGold=rand(10,20),gold=Math.floor(baseGold*getDifficultyGoldMultiplier());
        save.gold=(save.gold||0)+gold;
        print(`你获得了 ${gold} 枚金币（基础${baseGold} ×难度金币倍率${getDifficultyGoldMultiplier().toFixed(2)}，已取整）！当前：${save.gold}`);
        writeSave();
    }
    if(hasSet("火4")){
        let bonus=Math.floor(player.atk*scaledElementEffect(0.10));
        player.atk+=bonus;
        print(`【火焰四件】攻击力永久提升${bonus}点！`);
    }else if(hasSet("火2")){
        let bonus=Math.floor(player.atk*scaledElementEffect(0.04));
        player.atk+=bonus;
        print(`【火焰两件】攻击力永久提升${bonus}点！`);
    }
    if(hasSet("水4")){
        let bonus=Math.floor(player.maxHp*scaledElementEffect(0.10));
        player.maxHp+=bonus;player.hp+=bonus;
        print(`【流水四件】血量上限永久提升${bonus}点！`);
    }else if(hasSet("水2")){
        let bonus=Math.floor(player.maxHp*scaledElementEffect(0.04));
        player.maxHp+=bonus;player.hp+=bonus;
        print(`【流水两件】血量上限永久提升${bonus}点！`);
    }
    if(player.blessing==="战士的祝福"){
        let bonus=Math.floor(player.atk*0.05);
        player.blessAtkAdd+=bonus;player.atk+=bonus;
        print(`【战士的祝福】攻击力提升${bonus}点！`);
    }
    if(player.blessing==="天使的祝福"){
        let bonus=Math.floor(player.maxHp*0.05);
        player.blessHpAdd+=bonus;player.maxHp+=bonus;player.hp+=bonus;
        print(`【天使的祝福】血量上限提升${bonus}点！`);
    }
    if(player.blessing==="勇者的祝福"){
        player.blessBjAdd+=0.03;player.blessBsAdd+=0.05;
        player.bj+=0.03;player.bs+=0.05;
        print(`【勇者的祝福】暴击率+3%，暴击伤害+5%！`);
    }
    if(player.blessing==="隐士的祝福"){
        player.blessCrtAdd+=0.03;player.crt+=0.03;
        print(`【隐士的祝福】闪避率+3%！`);
    }
    if(player.job==="战士"){
        let bonus=Math.floor(player.atk*0.03);
        player.permAtkAdd+=bonus;player.atk+=bonus;
        print(`【战士】攻击力额外提升${bonus}点！`);
    }
    if(player.job==="天使"){
        let bonus=Math.floor(player.maxHp*0.03);
        player.permHpAdd+=bonus;player.maxHp+=bonus;player.hp+=bonus;
        print(`【天使】血量上限额外提升${bonus}点！`);
    }
    if(player.job==="隐士"){
        player.crt+=0.02;
        print(`【隐士】闪避率+2%！`);
    }
    let atkGain=Math.floor(player.atk*0.02);
    let hpGain=Math.floor(player.maxHp*0.02);
    player.permAtkAdd+=atkGain;
    player.permHpAdd+=hpGain;
    player.atk+=atkGain;
    player.maxHp+=hpGain;
    player.hp+=hpGain;
    print(`战胜之力：攻击力+${atkGain}，血量上限+${hpGain}（永久）`);
    refreshStatPanel();
    if(gameState==="bossBattle"){
        if(enemy.name==="魔王"){trueEnd1();}
        else{trueEnd2();}
        return;
    }
    gameState="loot";
    let e1=genEquip();
    let e2=genEquip();
    refreshStatPanel();
    showLootChoice(e1,e2,"loot");
}

function onPlayerDefeat(){
    print("你被击败了...");
    gameState="badEnd";
    clearRunSave("auto");
    refreshStatPanel();
    badEnd(2);
}

function resumeEquipLossConfirmation(){
    clearChoices();
    print("已恢复装备变更确认，请确认后继续战斗。");
    addChoice("确认",()=>{gameState=enemy.name==="魔王"||enemy.name==="它"?"bossBattle":"battle";battleLoop();});
}
function resumeBossKnockoffConfirmation(){
    clearChoices();
    print("已恢复魔王震落装备确认，请确认后选择临时装备。");
    addChoice("确认",()=>{gameState="bossLoot";showLootChoice(genEquip(),genEquip(),"bossLoot");});
}

function nextWave(){
    player.wave++;
    if(player.wave>20){
        gameState="bossKnockoff";
        let lose=1;
        print(`\n魔王出现了！它的威压震落了你的1件装备！`);
        let filled=[];
        for(let i=0;i<player.slots.length;i++){if(player.slots[i])filled.push(i);}
        for(let i=filled.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[filled[i],filled[j]]=[filled[j],filled[i]];}
        let dropCount=Math.min(lose,filled.length);
        let droppedItems=[];
        for(let i=0;i<dropCount;i++){
            let ridx=filled[i];
            droppedItems.push(player.slots[ridx]);
            player.slots[ridx]=null;
        }
        applyEquipStats();
        refreshStatPanel();
        clearChoices();
        for(let dropped of droppedItems){print(`你的装备被震落了：`);showEquip(dropped);}
        if(!droppedItems.length)print("你没有装备可被震落。");
        addChoice("确认",()=>{gameState="bossLoot";showLootChoice(genEquip(),genEquip(),"bossLoot");});
        autoSaveRun();
        return;
    }
    print(`\n=== 第 ${player.wave} 波 ===`);
    if(!genEnemy(false))return;
    print(`遭遇了 【${enemy.name}】！ATK:${enemy.atk} HP:${enemy.hp}`);
    gameState="battle";
    battleLoop();
}

function enterBoss(){
    gameState="bossBattle";
    if(player.Q3>=3){
        print("\n……你就是不肯听话，是不是？");
        print("空间扭曲了，真正的恐怖降临了……");
        genEnemy(true,"它");
        print("\n【魔王的加护】魔王的力量涌入你的体内！");
        player.atk=Math.floor(player.atk*5);
        player.maxHp=Math.floor(player.maxHp*5);
        healPlayer(player.maxHp,"魔王加护");
        player.bj=player.bj*2;
        player.bs=player.bs*2;
        player.crt=player.crt*3;
        print(`当前属性：ATK ${player.atk} | HP ${player.maxHp} | 暴击 ${Math.floor(player.bj*100)}% | 爆伤 ${Math.floor(player.bs*100)}% | 闪避 ${Math.floor(player.crt*100)}%`);
    }else{
        print("\n魔王站在你面前！");
        genEnemy(true,"魔王");
    }
    print(`【${enemy.name}】 ATK:${enemy.atk} HP:${enemy.hp}`);
    autoSaveRun();
    clearChoices();
    addChoice("迎战魔王",()=>battleLoop());
    if(player.Q3<3){
        addChoice("拒绝迎战",()=>{
            player.Q3++;
            if(player.Q3>=3){
                print("……你就是不肯听话，是不是？");
                gameState="bossBattle";
                setTimeout(()=>{enterBoss();},500);
            }else{
                print("请专注战斗。");
                enterBoss();
            }
        },"btn-danger");
    }
}

function badEnd(type){
    clearRunSave("auto");
    clearChoices();
    let msgs={
        1:"【Bad End 1】你逃离了战场，传说就此终结。",
        2:"【Bad End 2】你倒在了血泊中，再也没有醒来。",
        3:"【Bad End 3】你被魔王的力量吞噬，成为了它的傀儡。",
        4:"【Bad End 4】你在恐惧中放弃了，世界陷入黑暗。",
        5:"【Bad End 5】你的装备全部损毁，手无寸铁的你无法继续。",
        6:"【Bad End 6】你迷失在了无尽的战斗中，忘记了回家的路。"
    };
    print(msgs[type]||"【Bad End】故事结束了。");
    addChoice("重新开始",()=>location.reload());
}

function trueEnd1(){
    clearChoices();
    print("\n【True End 1 - 浴血之剑】");
    print("你击败了魔王！世界恢复了和平。");
    print("你的传说将被永远传颂。");
    save.eyeTotal=Math.min(24,save.eyeTotal+2);
    print(`你获得了 2 枚魔王之眼！当前：${save.eyeTotal}/24`);
    writeSave();
    clearRunSave("auto");
    refreshStatPanel();
    addChoice("重新开始",()=>location.reload());
}

function trueEnd2(){
    clearChoices();
    print("\n【True End 2 - 回家】");
    print("你击败了它！那不可名状的存在消散了。");
    print("你找到了回家的路。");
    if(save.blood<10){save.blood++;print(`你获得了 1 颗它之血珠！当前：${save.blood}/10`);}
    else{print("它之血珠已达上限（10颗），无法继续获取。");}
    save.eyeTotal=Math.min(24,save.eyeTotal+1);
    print(`你获得了 1 枚魔王之眼！当前：${save.eyeTotal}/24`);
    writeSave();
    clearRunSave("auto");
    refreshStatPanel();
    addChoice("重新开始",()=>location.reload());
}

function startGame(){
    gameState="start";
    clearRunSave("auto");
    outputDom.innerHTML="";
    refreshStatPanel();
    print("欢迎来到卡桑德里传说8.0");
    print("在这片被黑暗笼罩的大陆上，你将踏上讨伐魔王的旅程。");
    bannedJob=null;bannedBless=null;
    if(save.useBlood>=3){
        let jobs=Object.keys(jobData);
        bannedJob=jobs[Math.floor(Math.random()*jobs.length)];
        let blesses=Object.keys(blessingData);
        bannedBless=blesses[Math.floor(Math.random()*blesses.length)];
        print(`\n【难度${save.useBlood}】黑暗的诅咒笼罩了一切！`);
        print(`职业【${bannedJob}】被禁止选择！`);
        print(`祝福【${bannedBless}】被禁止选择！`);
    }
    print("\n请选择你的职业：");
    clearChoices();
    for(let j in jobData){
        if(j===bannedJob){addChoice(`【已禁用】${j} - ${jobData[j].desc}`,()=>{print("该职业已被黑暗诅咒封印，无法选择。");});}
        else{addChoice(`${j} - ${jobData[j].desc}`,()=>selectJob(j));}
    }
}

function selectJob(j){
    player.job=j;
    print(`你选择了 ${j}`);
    print("\n请选择你的祝福：");
    clearChoices();
    for(let b in blessingData){
        if(b===bannedBless){addChoice(`【已禁用】${b} - ${blessingData[b].desc}`,()=>{print("该祝福已被黑暗诅咒封印，无法选择。");});}
        else{addChoice(`${b} - ${blessingData[b].desc}`,()=>selectBlessing(b));}
    }
}

function selectBlessing(b){
    player.blessing=b;
    player.blessAtkAdd=0;player.blessHpAdd=0;player.blessBjAdd=0;player.blessBsAdd=0;player.blessCrtAdd=0;
    player.permAtkAdd=0;player.permHpAdd=0;
    player.energy=0;player.nextDefendBoost=false;player.ZBSPECIALUSED1=0;player.ZDYHP=0;player.shields=null;normalizeCombatant(player);
    initSlots();
    print(`你获得了 ${b}`);
    applyEquipStats();
    if(player.blessing==="勇者的祝福"&&player.bj>1){
        let shield=Math.floor((player.bj-1.0)*0.4*100);
        grantShield(player,"hits",shield);print(`【勇者的祝福】暴击溢出转化为 ${shield} 点次数盾！`);
    }
    refreshStatPanel();
    print("\n准备好开始冒险了吗？");
    clearChoices();
    if(!preferences.tutorialSeen){
        addChoice("新手教程（仅首次）",()=>beginAdventure(true));
        addChoice("跳过教程，直接开战",()=>beginAdventure(false));
    }else{
        addChoice("开始冒险",()=>beginAdventure(false));
    }
}

function beginAdventure(showTutorialFirst){
    player.canAdjustPoint=false;
    preferences.tutorialSeen=true;
    writePreferences();
    refreshStatPanel();
    if(showTutorialFirst){showTutorial();}
    else{player.wave=0;nextWave();}
}

function showTutorial(){
    print("\n=== 游戏教程 ===");
    print("1. 每波战斗你可以选择攻击、防御或逃跑。");
    print("2. 击败敌人有概率获得装备，装备可以提升属性。");
    print("3. 装备有火/水/草/雷四种属性，2件同属性小幅加成，4件大幅加成。");
    print("4. 部分装备带有特殊特性，效果强大。");
    print("5. 击败20波小怪后将面对魔王。");
    print("6. 魔王之眼可永久强化初始属性，它之血珠可提升难度。");
    print("7. 右侧面板可在开局时分配点数，进入战斗后锁定。");
    clearChoices();
    addChoice("开始冒险",()=>{player.wave=0;nextWave();});
}

function runStateLabel(state){return state==="loot"||state==="bossLoot"?"装备选择中":state==="bossBattle"?"BOSS 战斗中":"战斗中";}
function formatSavedAt(value){
    let date=new Date(value);
    return Number.isNaN(date.getTime())?"时间未知":date.toLocaleString("zh-CN",{hour12:false});
}
function renderSaveManager(notice=""){
    let canSave=Boolean(snapshotRun());
    document.getElementById("saveContent").innerHTML=runSaveSlots.map(slot=>{
        let snapshot=readRunSave(slot),title=slot==="auto"?"自动存档":`手动槽位 ${slot}`;
        let description=snapshot?`${runStateLabel(snapshot.state)} · 第 ${snapshot.player.wave||0} 波 · ${formatSavedAt(snapshot.savedAt)}`:"暂无可恢复的兼容存档";
        let controls=slot==="auto"?`<button class="choice-btn" onclick="loadRunSlot('auto')" ${snapshot?"":"disabled"}>继续</button>`:`<button class="choice-btn" onclick="saveToSlot('${slot}')" ${canSave?"":"disabled"}>保存</button><button class="choice-btn" onclick="loadRunSlot('${slot}')" ${snapshot?"":"disabled"}>读取</button>`;
        return `<article class="save-slot"><div><h3>${title}</h3><p>${description}</p></div><div class="save-actions">${controls}</div></article>`;
    }).join("");
    if(notice){let summary=document.createElement("p");summary.className="modal-notice";summary.textContent=notice;document.getElementById("saveContent").prepend(summary);}
}
function openSaveManager(){
    cancelLootAutoSelect();
    document.getElementById("saveOverlay").hidden=false;
    cancelPendingSaveImport();
    showSaveTransferNotice("");
    renderSaveManager();
}
function openHomeSaveManager(){openSaveManager();}
function openHomeShop(){openShop();}
function closeSaveManager(){cancelPendingSaveImport();document.getElementById("saveOverlay").hidden=true;resumeLootAutoSelectIfReady();}
function saveToSlot(slot){
    let result=writeRunSave(slot);
    renderSaveManager(result.message);
}
function loadRunSlot(slot){
    let snapshot=readRunSave(slot);
    if(!snapshot){renderSaveManager("该槽位没有兼容存档。");return;}
    restoreRunSnapshot(snapshot);
}
function syncPreferenceControls(){
    let crt=document.getElementById("crtToggle"),motion=document.getElementById("reduceMotionToggle"),collapse=document.getElementById("collapseEventsToggle");
    if(crt)crt.checked=preferences.crt;
    if(motion)motion.checked=!preferences.reduceMotion;
    if(collapse)collapse.checked=preferences.collapseEvents;
    syncLootAutoSelectControls();
    syncAutoBattleControl();
}
function syncAutoBattleControl(){
    let control=document.getElementById("settingsAutoBattle");
    if(control)control.checked=autoBattle;
}
function cancelAutoBattleStep(){
    if(autoBattleTimer!==null){clearTimeout(autoBattleTimer);autoBattleTimer=null;}
}
function scheduleAutoBattleStep(callback){
    cancelAutoBattleStep();
    autoBattleTimer=setTimeout(()=>{
        autoBattleTimer=null;
        if(!autoBattle||gamePaused||(gameState!=="battle"&&gameState!=="bossBattle"))return;
        callback();
    },300);
}
function setAutoBattle(enabled){
    cancelAutoBattleStep();
    autoBattle=Boolean(enabled);
    syncAutoBattleControl();
}
function openSettings(){
    cancelLootAutoSelect();
    cancelAutoBattleStep();
    autoBattleBeforeSettings=autoBattle;
    gamePaused=true;
    syncPreferenceControls();
    document.getElementById("settingsOverlay").hidden=false;
}
function closeSettings(){
    let settings=document.getElementById("settingsOverlay");
    let wasOpen=!settings.hidden;
    settings.hidden=true;
    if(!wasOpen)return;
    gamePaused=false;
    resumeLootAutoSelectIfReady();
    if((autoBattle||autoBattle!==autoBattleBeforeSettings)&&(gameState==="battle"||gameState==="bossBattle"))battleLoop();
}

function initApp(){
    const app=document.getElementById("app");
    const welcome=document.getElementById("welcomeOverlay");
    const settings=document.getElementById("settingsOverlay");
    const changelog=document.getElementById("changelogOverlay");
    const crtToggle=document.getElementById("crtToggle");
    const reduceMotionToggle=document.getElementById("reduceMotionToggle");
    const collapseEventsToggle=document.getElementById("collapseEventsToggle");
    const settingsAutoBattle=document.getElementById("settingsAutoBattle");
    const settingsLootAutoSelect=document.getElementById("settingsLootAutoSelect");
    const continueButton=document.getElementById("btnContinue");
    const saveImportInput=document.getElementById("saveImportInput");
    document.getElementById("btnNewGame").onclick=()=>{welcome.hidden=true;startGame();};
    continueButton.onclick=()=>{let snapshot=readRunSave("auto");if(snapshot)restoreRunSnapshot(snapshot);};
    document.getElementById("btnHomeSave").onclick=()=>openHomeSaveManager();
    document.getElementById("btnHomeShop").onclick=()=>openHomeShop();
    document.getElementById("btnChangelog").onclick=()=>{changelog.hidden=false;};
    document.getElementById("btnChangelogClose").onclick=()=>{changelog.hidden=true;};
    document.getElementById("settingsBtn").onclick=()=>openSettings();
    document.getElementById("btnSettingsClose").onclick=()=>closeSettings();
    document.getElementById("btnOpenSaveFromSettings").onclick=()=>{closeSettings();openSaveManager();};
    document.getElementById("btnShopClose").onclick=()=>closeShop();
    document.getElementById("btnSaveClose").onclick=()=>closeSaveManager();
    document.getElementById("btnExportSave").onclick=()=>exportSaveArchive();
    document.getElementById("btnImportSave").onclick=()=>{saveImportInput.value="";saveImportInput.click();};
    document.getElementById("btnConfirmSaveImport").onclick=()=>confirmSaveImport();
    document.getElementById("btnCancelSaveImport").onclick=()=>{cancelPendingSaveImport();showSaveTransferNotice("已取消导入，当前存档保持不变。");};
    saveImportInput.onchange=()=>stageSaveImport(saveImportInput.files&&saveImportInput.files[0]);
    document.getElementById("btnSetClose").onclick=()=>{document.getElementById("setOverlay").hidden=true;resumeLootAutoSelectIfReady();};
    document.getElementById("btnDifficultyPrev").onclick=()=>shiftDifficulty(-1);
    document.getElementById("btnDifficultyNext").onclick=()=>shiftDifficulty(1);
    document.getElementById("btnDifficultyApply").onclick=()=>applyDifficultySelection();
    document.getElementById("btnDifficultyClose").onclick=()=>closeDifficultyPanel();
    crtToggle.onchange=()=>{preferences.crt=crtToggle.checked;writePreferences();applyPreferences();};
    reduceMotionToggle.onchange=()=>{preferences.reduceMotion=!reduceMotionToggle.checked;writePreferences();applyPreferences();};
    collapseEventsToggle.onchange=()=>{preferences.collapseEvents=collapseEventsToggle.checked;writePreferences();};
    settingsAutoBattle.onchange=()=>setAutoBattle(settingsAutoBattle.checked);
    settingsLootAutoSelect.onchange=()=>toggleLootAutoSelect(settingsLootAutoSelect.checked);
    document.addEventListener("keydown",event=>{if(event.key!=="Escape")return;closeSettings();changelog.hidden=true;closeShop();document.getElementById("setOverlay").hidden=true;closeDifficultyPanel();closeSaveManager();});
    applyPreferences();
    syncPreferenceControls();
    continueButton.disabled=!readRunSave("auto");
    refreshStatPanel();
    welcome.hidden=false;
}
initApp();
