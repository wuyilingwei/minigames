import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const runtime = await readFile(resolve(root, 'games/cassandri-legend/game.js'), 'utf8');

const tierStart = runtime.indexOf('const equipmentTierData=');
const tierEnd = runtime.indexOf('\nfunction hasAddonSlotFor', tierStart);
if (tierStart < 0 || tierEnd < 0) throw new Error('Equipment tier metadata is not centralized.');
const tierModel = runtime.slice(tierStart, tierEnd);
const tiers = new Function(`${tierModel}\nreturn {equipmentTierData,normalizeAffixTier,getEquipmentTier};`)();
if (tiers.equipmentTierData.map(item => item.name).join('/') !== '制式/精工/秘藏/神铸') throw new Error('Equipment tiers must use the four agreed names.');
if (tiers.normalizeAffixTier(undefined) !== 0 || tiers.normalizeAffixTier(9) !== 3 || tiers.normalizeAffixTier(-1) !== 0) throw new Error('Equipment tier normalization must default and clamp safely.');

const jobs = runtime.match(/const jobData=\{[\s\S]*?\n\};/)?.[0] || '';
for (const [job, value] of [['战士', 'crt:0.12'], ['天使', 'crt:0.14'], ['勇者', 'crt:0.16'], ['隐士', 'crt:0.42']]) {
  if (!jobs.includes(`"${job}":{`) || !jobs.includes(`${value},`)) throw new Error(`${job} base dodge is not balanced to ${value}.`);
}
if (!runtime.includes('let atk=Math.floor(rand(5,25)*scale),hp=Math.floor(rand(10,80)*scale),bj=rand(0,8)/100,bs=rand(0,10)/100,crt=rand(3,10)/100;')) throw new Error('Random equipment dodge must have a 3% lower bound before wave scaling.');
if (!runtime.includes('crt=Math.floor(crt*scale*100)/100;')) throw new Error('Random equipment dodge must retain wave scaling.');
if (runtime.includes('词条阶')) throw new Error('The old numeric equipment tier label must not remain in the runtime.');
for (const name of ['制式', '精工', '秘藏', '神铸']) if (!runtime.includes(name)) throw new Error(`Missing equipment tier label: ${name}`);

const sample = (seed, wave) => {
  let state = seed;
  const random = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 0x100000000);
  const rand = (min, max) => Math.floor(random() * (max - min + 1)) + min;
  const scale = 1 + Math.min(1, wave / 20);
  const base = rand(3, 10) / 100;
  return Math.floor(base * scale * 100) / 100;
};
const lowWave = Array.from({ length: 10000 }, (_, index) => sample(index + 1, 0));
const highWave = Array.from({ length: 10000 }, (_, index) => sample(index + 1, 20));
if (Math.min(...lowWave) < 0.03 || Math.max(...lowWave) > 0.10 || Math.min(...highWave) < 0.06 || Math.max(...highWave) > 0.20) throw new Error('Random dodge bounds or wave growth are outside the contract.');
if (highWave.reduce((sum, value) => sum + value, 0) <= lowWave.reduce((sum, value) => sum + value, 0)) throw new Error('Random dodge must grow with wave scaling.');
console.log('Verified four equipment tier names, legacy defaults, class dodge balance, starter stats, and random dodge bounds/growth.');
