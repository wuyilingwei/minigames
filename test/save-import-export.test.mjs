import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const sourcePath = join(root, 'games', 'cassandri-legend', 'index.html');
const html = await readFile(sourcePath, 'utf8');
const runtime = await readFile(join(root, 'games', 'cassandri-legend', 'game.js'), 'utf8');
const source = `${html}\n${runtime}`;

function requireText(text, message) {
  if (!source.includes(text)) throw new Error(`${message}: missing ${text}`);
}

function requirePattern(pattern, message) {
  if (!pattern.test(source)) throw new Error(message);
}

for (const control of [
  'id="btnExportSave"',
  'id="btnImportSave"',
  'id="saveImportInput"',
  'id="saveImportConfirm"',
  'id="btnConfirmSaveImport"',
  'id="btnCancelSaveImport"',
]) {
  requireText(control, `The complete-save transfer UI must expose ${control}`);
}

requireText('const SAVE_ARCHIVE_KIND="cassandri-legend-save"', 'Exports must use an identifiable archive format');
requireText('const SAVE_ARCHIVE_VERSION=1', 'Exports must carry a format version');
requireText('const runSaveSlots=["auto","1","2","3"]', 'All resumable save slots must remain in the transfer set');
requirePattern(/function buildSaveArchive\(\)[\s\S]*for\(let slot of runSaveSlots\)runs\[slot\]=readRunSave\(slot\)[\s\S]*save:cloneForStorage\(normalizeSave\(save\)\)/, 'Exports must include the permanent profile and every run slot');

const archiveBuilder = runtime.slice(runtime.indexOf('function buildSaveArchive()'), runtime.indexOf('function validateSaveArchive('));
if (/preferences|cheatBackup|CHEAT_SECRET/.test(archiveBuilder)) {
  throw new Error('Exports must not include local settings or cheat-only state');
}

requirePattern(/function validateSaveArchive\(archive\)[\s\S]*archive\.kind!==SAVE_ARCHIVE_KIND[\s\S]*archive\.formatVersion!==SAVE_ARCHIVE_VERSION[\s\S]*!isRecord\(archive\.save\)\|\|!isRecord\(archive\.runs\)/, 'Imports must reject foreign, unsupported, or incomplete archives');
requirePattern(/function validateSaveArchive\(archive\)[\s\S]*hasOwnProperty\.call\(archive\.runs,slot\)[\s\S]*validateRunSnapshot\(archive\.runs\[slot\]\)/, 'Every imported run slot must be present and pass the existing compatibility validator');
requireText('SAVE_ARCHIVE_MAX_BYTES=2*1024*1024', 'Import file size must be bounded before parsing');

requirePattern(/function stageSaveImport\(file\)[\s\S]*validateSaveArchive\(JSON\.parse\(await file\.text\(\)\)\)[\s\S]*saveImportConfirm[\s\S]*文件校验通过/, 'A selected archive must be validated before the overwrite confirmation appears');
requirePattern(/function writeImportedSaveArchive\(archive\)[\s\S]*let previous=\{\}[\s\S]*catch\(error\)[\s\S]*Object\.entries\(previous\)/, 'A failed multi-key import must restore the previous local save values');
requirePattern(/function confirmSaveImport\(\)[\s\S]*writeImportedSaveArchive\(pendingSaveImport\)[\s\S]*location\.reload\(\)/, 'A confirmed import must write the archive and reload before the active run can overwrite it');

console.log('Verified complete save export, guarded import, rollback, and reload contracts.');
