import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const file = new URL("../games/cassandri-legend/index.html", import.meta.url);
const html = fs.readFileSync(file, "utf8");

function extractFunction(name) {
  const match = html.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n\\}`));
  assert.ok(match, `missing ${name}`);
  return match[0];
}

test("battle arena exposes ally/enemy roster containers and legacy primary IDs", () => {
  assert.match(html, /id="battleArena"[^>]*aria-label="战斗对阵"/);
  assert.match(html, /id="allyRoster"[^>]*aria-label="我方单位"/);
  assert.match(html, /id="enemyRoster"[^>]*aria-label="敌方单位"/);
  assert.match(html, /id="playerCombatant"/);
  assert.match(html, /id="enemyBarArea"/);
  assert.match(html, /player\.allies/);
  assert.match(html, /enemy\.enemies/);
});

test("pixel sprite adapter creates distinct, accessible SVG units", () => {
  const context = {};
  vm.runInNewContext(`${extractFunction("pixelSpriteMarkup")}\nthis.sprite=pixelSpriteMarkup;`, context);
  const sprite = context.sprite;
  assert.match(sprite("guardian"), /pixel-sprite/);
  assert.match(sprite("guardian"), /#88b8ff/);
  assert.match(sprite("undead"), /#b5c3cc/);
  assert.match(sprite("beast"), /aria-label="像素单位"/);
  const kindSource = extractFunction("unitKind");
  const kindContext = {};
  vm.runInNewContext(`${kindSource}\nthis.kind=unitKind;`, kindContext);
  assert.equal(kindContext.kind({ job: "法师" }, "ally"), "caster");
  assert.equal(kindContext.kind({ name: "骷髅兵" }, "enemy"), "undead");
  assert.equal(kindContext.kind({ name: "狼" }, "enemy"), "beast");
});

test("feedback and responsive roster contracts are executable in source", () => {
  assert.match(html, /type==="dodge"\?"dodge":type==="attack"\?"attack"/);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /body,#app\{min-width:0/);
  assert.match(html, /for\(let i=1;i<allies\.length;i\+\+\)/);
  assert.match(html, /for\(let i=1;i<enemies\.length;i\+\+\)/);
});
