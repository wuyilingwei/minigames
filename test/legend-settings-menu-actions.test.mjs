import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { resolve } from 'node:path';

const root=resolve(new URL('..',import.meta.url).pathname);
const index=await readFile(resolve(root,'games/cassandri-legend/index.html'),'utf8');
const runtime=await readFile(resolve(root,'games/cassandri-legend/game.js'),'utf8');

for(const [id,label] of [['btnReturnToMenu','退出到主菜单'],['btnAbandonRun','放弃征途']]){
  if(!index.includes(`id="${id}"`)||!index.includes(`>${label}</button>`))throw new Error(`ESC settings menu is missing ${label}`);
  if(!runtime.includes(`document.getElementById("${id}").onclick`))throw new Error(`${label} is not wired`);
}
if(!/if\(welcome\.hidden\)openSettings\(\);/.test(runtime))throw new Error('Escape must open settings when gameplay is visible and no other modal is open');
if(!/function startGame\(\)\{\s*gamePaused=false;/.test(runtime))throw new Error('Starting a new adventure after returning home must unpause gameplay');

const source=runtime.match(/function returnToMainMenu\(abandon=false\)\{[\s\S]*?\n\}/)?.[0];
if(!source)throw new Error('Could not extract main-menu return behavior');
function createContext(hasAutoSave=true){
  const elements={difficultyOverlay:{hidden:false},welcomeOverlay:{hidden:true},btnContinue:{disabled:false}};
  const calls={loot:0,battle:0,autosave:0,cleared:[],hidden:0,refresh:0};
  const context={calls,document:{getElementById:id=>elements[id]},cancelLootAutoSelect(){calls.loot++;},cancelAutoBattleStep(){calls.battle++;},autoSaveRun(){calls.autosave++;},clearRunSave(slot){calls.cleared.push(slot);hasAutoSave=false;},hideGameOverlays(){calls.hidden++;},readRunSave:()=>hasAutoSave?{}:null,refreshStatPanel(){calls.refresh++;},gamePaused:false};
  vm.createContext(context);vm.runInContext(source,context);return {context,elements};
}
const retained=createContext(true);retained.context.returnToMainMenu(false);
if(retained.context.calls.autosave!==1||retained.context.calls.cleared.length||retained.elements.welcomeOverlay.hidden||retained.elements.btnContinue.disabled||!retained.context.gamePaused)throw new Error('Exit to main menu must preserve the auto save and pause gameplay');
const abandoned=createContext(true);abandoned.context.returnToMainMenu(true);
if(abandoned.context.calls.autosave||abandoned.context.calls.cleared.join('/')!=='auto'||abandoned.elements.welcomeOverlay.hidden||!abandoned.elements.btnContinue.disabled||!abandoned.context.gamePaused)throw new Error('Abandon adventure must clear only the auto save and return to the paused main menu');
for(const result of [retained,abandoned])if(result.context.calls.loot!==1||result.context.calls.battle!==1||result.context.calls.hidden!==1||result.context.calls.refresh!==1)throw new Error('Returning home must stop pending automation, hide overlays, and refresh the HUD');

console.log('Verified ESC menu return-to-main and abandon-adventure actions.');
