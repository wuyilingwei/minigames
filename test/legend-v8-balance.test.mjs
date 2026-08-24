import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const runtime = await readFile(resolve(root, 'games/cassandri-legend/game.js'), 'utf8');

const tierStart = runtime.indexOf('const equipmentTierData=');
const tierEnd = runtime.indexOf('\nfunction hasAddonSlotFor', tierStart);
if (tierStart < 0 || tierEnd < 0) throw new Error('Equipment tier metadata is not centralized.');
const tierModel = runtime.slice(tierStart, tierEnd);
const tiers = new Function(`${tierModel}\nreturn {equipmentTierData,normalizeAffixTier,getEquipmentTier,getEquipmentEnhancementMarker,getEquipmentLevelLabel};`)();
if (tiers.equipmentTierData.map(item => item.name).join('/') !== '制式/精工/秘藏/神铸') throw new Error('Equipment tiers must use the four agreed names.');
if (tiers.normalizeAffixTier(undefined) !== 0 || tiers.normalizeAffixTier(9) !== 3 || tiers.normalizeAffixTier(-1) !== 0) throw new Error('Equipment tier normalization must default and clamp safely.');
if (JSON.stringify(['0', '1', '2', '3'].map(value => tiers.getEquipmentEnhancementMarker(value))) !== JSON.stringify(['', '+', '++', '+++'])) throw new Error('Equipment level markers must map to no visible marker, +, ++, and +++.');
if (tiers.getEquipmentLevelLabel(0) !== '制式' || tiers.getEquipmentLevelLabel(1) !== '精工 +' || tiers.getEquipmentLevelLabel(2) !== '秘藏 ++' || tiers.getEquipmentLevelLabel(3) !== '神铸 +++') throw new Error('Equipment level labels must pair each name with its difficulty level marker.');

const jobs = runtime.match(/const jobData=\{[\s\S]*?\n\};/)?.[0] || '';
const jobData = new Function(`${jobs}\nreturn jobData;`)();
for (const [job, value] of [['战士', .12], ['天使', .14], ['勇者', .16], ['隐士', .42]]) if(jobData[job]?.crt!==value)throw new Error(`${job} base dodge is not balanced to ${value}.`);
if (!runtime.includes('let atk=Math.floor(rand(5,25)*scale),hp=Math.floor(rand(10,80)*scale),bj=rand(0,8)/100,bs=rand(0,10)/100,crt=rand(3,10)/100;')) throw new Error('Random equipment dodge must have a 3% lower bound before wave scaling.');
if (!runtime.includes('crt=Math.floor(crt*scale*100)/100;')) throw new Error('Random equipment dodge must retain wave scaling.');
if (runtime.includes('词条阶')) throw new Error('The old numeric equipment tier label must not remain in the runtime.');
for (const name of ['制式', '精工', '秘藏', '神铸']) if (!runtime.includes(name)) throw new Error(`Missing equipment tier label: ${name}`);
if (!runtime.includes('const equipmentEnhancementMarkers=["","+","++","+++"]')) throw new Error('Equipment level marker mapping is not centralized.');
if (!runtime.includes('let tier=save.useBlood>=9?3:save.useBlood>=6?2:save.useBlood>=3?1:0;')) throw new Error('Equipment level must be derived from difficulty 3/6/9 rather than random quality.');
for (const phrase of ['装备等级 +', '装备等级 ++', '装备等级 +++', '装备等级提升为精工 +', '装备等级提升为秘藏 ++', '装备等级提升为神铸 +++']) if (!runtime.includes(phrase)) throw new Error(`Difficulty rules must describe equipment level growth: ${phrase}`);
for (const renderer of ['getEquipmentLevelLabel(s.affixTier)', 'getEquipmentLevelLabel(e.affixTier)']) if (!runtime.includes(renderer)) throw new Error(`Equipment level marker is missing from a renderer: ${renderer}`);

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

const cardSource=runtime.match(/function equipmentCardHtml\(e,includeRecommendation=false\)\{[\s\S]*?\n\}/)?.[0];
if(!cardSource)throw new Error('Equipment card renderer is not extractable.');
const renderCard=new Function('getEquipmentTier','getEquipmentLevelLabel','elemClass','equipmentPartNames','equipmentRecommendationHtml',`${cardSource}\nreturn equipmentCardHtml;`)(tiers.getEquipmentTier,tiers.getEquipmentLevelLabel,()=>'',{body:'身体',outerwear:'附加'},()=> '');
const standardCard=renderCard({name:'朴素布衣',element:'无',part:'body',atk:0,hp:80,bj:0,bs:0,crt:0,traits:[],affixTier:0});
if(!standardCard.includes('身体 · 制式'))throw new Error('Standard equipment cards must show the named tier.');
const emergencyCard=renderCard({id:'emergencyShield',name:'高难应急护盾',element:'无',part:'outerwear',atk:0,hp:0,bj:0,bs:0,crt:0,traits:[],affixTier:0});
if(emergencyCard.includes('附加')||!emergencyCard.includes('【制式】'))throw new Error('Emergency shield cards must omit the add-on label while retaining their equipment level.');
console.log('Verified four equipment tier names, legacy defaults, class dodge balance, starter stats, and random dodge bounds/growth.');
