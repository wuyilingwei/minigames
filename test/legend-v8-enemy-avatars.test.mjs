import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const runtime = fs.readFileSync(new URL("../games/cassandri-legend/game.js", import.meta.url), "utf8");
function extractFunction(name){
  const match=runtime.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n\\}`));
  assert.ok(match, `missing ${name}`);
  return match[0];
}

test("enemy avatar identity is stable and visibly differentiated", () => {
  const context={};
  vm.runInNewContext(`${extractFunction("enemyAvatarSeed")}\n${extractFunction("enemyPixelSpriteMarkup")}\nthis.render=enemyPixelSpriteMarkup;`, context);
  const render=context.render;
  const first=render("苍蓝裂喉狼","beast");
  assert.equal(first,render("苍蓝裂喉狼","beast"));
  assert.notEqual(first,render("赤焰裂喉狼","beast"));
  assert.match(first,/role="img"/);
  assert.match(first,/aria-label="敌方像素头像：苍蓝裂喉狼"/);
  assert.match(first,/data-avatar-seed="\d+"/);
});

test("roster sprite injection selects the full enemy name avatar", () => {
  const context={};
  vm.runInNewContext(`${extractFunction("unitKind")}\n${extractFunction("enemyAvatarSeed")}\n${extractFunction("enemyPixelSpriteMarkup")}\n${extractFunction("pixelSpriteMarkup")}\n${extractFunction("setCombatantSprite")}\nthis.set=setCombatantSprite;`, context);
  const avatar={innerHTML:""};
  const card={dataset:{},attrs:{},querySelector:()=>avatar,setAttribute:(key,value)=>{card.attrs[key]=value;}};
  context.set(card,{name:"深渊咏唱者",job:"法师"},"enemy");
  assert.match(avatar.innerHTML,/enemy-pixel-sprite/);
  assert.match(avatar.innerHTML,/深渊咏唱者/);
  assert.equal(card.dataset.unitKind,"caster");
});
