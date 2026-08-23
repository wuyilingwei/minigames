import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const file = new URL("../games/cassandri-legend/index.html", import.meta.url);
const html = fs.readFileSync(file, "utf8");
const runtime = fs.readFileSync(new URL("../games/cassandri-legend/game.js", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../games/cassandri-legend/styles.css", import.meta.url), "utf8");
const source = `${html}\n${styles}\n${runtime}`;

function extractFunction(name) {
  const match = runtime.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n\\}`));
  assert.ok(match, `missing ${name}`);
  return match[0];
}

test("battle arena exposes ally/enemy roster containers and legacy primary IDs", () => {
  assert.match(source, /id="battleArena"[^>]*aria-label="战斗对阵"/);
  assert.match(source, /id="allyRoster"[^>]*aria-label="我方单位"/);
  assert.match(source, /id="enemyRoster"[^>]*aria-label="敌方单位"/);
  assert.match(source, /id="playerCombatant"/);
  assert.match(source, /id="enemyBarArea"/);
  assert.match(source, /player\.allies/);
  assert.match(source, /enemy\.enemies/);
});

test("pixel sprite adapter creates four distinct, accessible job SVG units", () => {
  const context = {};
  vm.runInNewContext(`${extractFunction("pixelSpriteMarkup")}\nthis.sprite=pixelSpriteMarkup;`, context);
  const sprite = context.sprite;
  const jobs = {
    warrior: sprite("warrior"), angel: sprite("angel"), hero: sprite("hero"), hermit: sprite("hermit")
  };
  for (const markup of Object.values(jobs)) {
    assert.match(markup, /<svg class="pixel-sprite" viewBox="0 0 16 16" role="img"/);
  }
  assert.equal(new Set(Object.values(jobs)).size, 4, "each job must have unique SVG output");
  assert.match(jobs.warrior, /像素单位：战士/);
  assert.match(jobs.warrior, /#6f7f9f/);
  assert.match(jobs.warrior, /#e9e3c2/);
  assert.match(jobs.angel, /像素单位：天使/);
  assert.match(jobs.angel, /<polygon points="1,7 4,5 5,12 1,10"/);
  assert.match(jobs.angel, /#ffe16b/);
  assert.match(jobs.hero, /像素单位：勇者/);
  assert.match(jobs.hero, /#d7e2e8/);
  assert.match(jobs.hero, /#4169e1/);
  assert.match(jobs.hermit, /像素单位：隐士/);
  assert.match(jobs.hermit, /<polygon points="3,6 5,1 11,1 13,6 12,10 4,10"/);
  assert.match(jobs.hermit, /#8b6b43/);
  const kindSource = extractFunction("unitKind");
  const kindContext = {};
  vm.runInNewContext(`${kindSource}\nthis.kind=unitKind;`, kindContext);
  assert.equal(kindContext.kind({ job: "战士" }, "ally"), "warrior");
  assert.equal(kindContext.kind({ name: "天使" }, "ally"), "angel");
  assert.equal(kindContext.kind({ job: "勇者" }, "ally"), "hero");
  assert.equal(kindContext.kind({ name: "隐士" }, "ally"), "hermit");
  assert.equal(kindContext.kind({ name: "未命名友军" }, "ally"), "hero");
  assert.equal(kindContext.kind({ name: "骷髅兵" }, "enemy"), "undead");
  assert.equal(kindContext.kind({ name: "狼" }, "enemy"), "beast");
});

test("feedback and responsive roster contracts are executable in source", () => {
  assert.match(source, /type==="dodge"\?"dodge":type==="attack"\?"attack"/);
  assert.match(source, /prefers-reduced-motion:reduce/);
  assert.match(source, /body,#app\{min-width:0/);
  assert.match(source, /for\(let i=1;i<allies\.length;i\+\+\)/);
  assert.match(source, /for\(let i=1;i<enemies\.length;i\+\+\)/);
});
