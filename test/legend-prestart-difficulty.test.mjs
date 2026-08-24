import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const runtime = await readFile(resolve(root, 'games/cassandri-legend/game.js'), 'utf8');

if (!runtime.includes('document.getElementById("btnNewGame").onclick=()=>openNewGameDifficulty();')) {
  throw new Error('New adventure must open the difficulty picker before hiding the welcome overlay.');
}
if (!runtime.includes('let difficultySelectionMode="info";')) throw new Error('Difficulty selection mode must be explicit.');
if (!runtime.includes('function openNewGameDifficulty(){')) throw new Error('New-adventure difficulty entry point is missing.');
if (!runtime.includes('let isNewGame=difficultySelectionMode==="new";')) throw new Error('Difficulty panel must distinguish new-game setup from in-run inspection.');
if (!runtime.includes('document.getElementById("welcomeOverlay").hidden=true;\n        startGame();')) {
  throw new Error('Confirming new-game difficulty must hide the welcome overlay only when starting the game.');
}
if (!runtime.includes('if(!isNewGame&&!player.canAdjustPoint)return;')) {
  throw new Error('New-game confirmation must work even when the selected difficulty is unchanged.');
}
const newGameEntry = runtime.indexOf('function openNewGameDifficulty(){');
const newGameEntryEnd = runtime.indexOf('\nfunction shiftDifficulty(', newGameEntry);
if (newGameEntry < 0 || newGameEntryEnd < 0 || runtime.slice(newGameEntry, newGameEntryEnd).includes('startGame();')) {
  throw new Error('New-game picker must not call startGame before confirmation.');
}
if (!runtime.includes('difficultySelectionMode="info";\n    resumeLootAutoSelectIfReady();')) {
  throw new Error('Closing the difficulty picker must clear new-game mode and leave no setup state.');
}
console.log('Verified new adventure difficulty confirmation, unchanged-level apply, and cancellation state transitions.');
