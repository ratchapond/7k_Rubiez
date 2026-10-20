const assert = require("node:assert/strict");
const test = require("node:test");
const { calculate, resetValues, fixed } = require("./calculator.js");

test("normal and nightmare scenarios, with and without the key pass", () => {
  for (const [mode, keyPass, runs, bonus, without, withMonthly] of [
    ["normal", false, 10683, 1300, 17100, 26820],
    ["normal", true, 11010, 1340, 20080, 30100],
    ["nightmare", false, 5341, 1300, -2320, 5440],
    ["nightmare", true, 5505, 1340, 60, 8080]
  ]) {
    const heroesPerRun = mode === "normal" ? 5 : 8;
    const r = calculate({ mode, keyPass, heroesPerRun });
    assert.equal(r.runs, runs);
    assert.equal(r.bonus, bonus);
    assert.equal(r.without.profit, without);
    assert.equal(r.withMonthly.profit, withMonthly);
    assert.equal(r.cost, 80000);
    assert.equal(r.dailyKeys, keyPass ? 720 : 480);
    assert.equal(calculate({ mode, keyPass, heroesPerRun, monthly: false }).selected.profit, without);
  }
});
test("paid box tier boundaries; free boxes add keys without cost", () => {
  for (const [paidBoxes, dailyCost] of [[0,0],[1,50],[20,1000],[21,1080],[70,5000],[71,5100],[120,10000]]) {
    const r = calculate({ paidBoxes, days: 1 });
    assert.equal(r.cost, dailyCost);
    assert.equal(r.boxKeys, (paidBoxes + 1) * 60);
    assert.equal(r.tier50 + r.tier80 + r.tier100, paidBoxes);
  }
  assert.equal(calculate({ paidBoxes: 0, freeBoxes: 2 }).cost, 0);
});
test("zero days has zero costs and rewards", () => {
  const r = calculate({ days: 0 });
  for (const key of ["cost","totalKeys","runs","bonus"]) assert.equal(r[key], 0);
  assert.equal(r.selected.profit, 0);
});
test("bonus threshold respects each mode and counts the base rounds only", () => {
  // 480 regen + 479 extra = 959 keys; both thresholds require 960 keys.
  for (const mode of ["normal", "nightmare"]) {
    const input = { mode, days: 1, paidBoxes: 0, freeBoxes: 0, extraKeys: 479 };
    assert.equal(calculate(input).bonus, 0);
    assert.equal(calculate({ ...input, extraKeys: 480 }).bonus, 20);
  }
});
test("target EXP is fixed at 12,500 even if older saved values override it", () => {
  const r = calculate({ exp: 100, targetExp: 1100 });
  assert.equal(r.withMonthly.runsPerHero, 114);
  assert.equal(r.without.runsPerHero, 125);
  assert.deepEqual(calculate({ targetExp: 0 }), calculate({}));
});
test("invalid values are rejected instead of showing misleading totals", () => {
  for (const input of [{days:NaN},{days:-1},{days:1.5},{exp:-1},{mode:"unknown"},{paidBoxes:Infinity},{heroesPerRun:-1},{heroesPerRun:1.5},{heroesPerRun:NaN}])
    assert.throws(() => calculate(input));
});
test("reset clears editable numbers except 110 extra keys and safely handles zero EXP", () => {
  for (const [key, value] of Object.entries(resetValues)) {
    if (typeof value === "number" && !(key in fixed)) assert.equal(value, key === "extraKeys" ? 110 : 0);
  }
  const r = calculate(resetValues);
  assert.equal(r.selected.profit, 0);
  assert.equal(r.selected.heroes, 0);
  assert.equal(r.selected.runsPerHero, null);
  assert.equal(r.runs, 0);
  assert.equal(calculate({ exp: 0 }).selected.ruby, 0);
});
test("locked rewards and keys ignore stale saved overrides", () => {
  assert.deepEqual(calculate({ keysPerBox: 1, rubyPerHero: 999, bonusKeys: 100 }), calculate({}));
});
test("team size changes rewards independently of mode and key consumption", () => {
  for (const mode of ["normal", "nightmare"]) {
    const three = calculate({ mode, heroesPerRun: 3 });
    const seven = calculate({ mode, heroesPerRun: 7 });
    assert.equal(three.runs, seven.runs);
    assert.equal(three.bonus, seven.bonus);
    assert.equal(three.totalKeys, seven.totalKeys);
    assert.equal(three.batchRuby, 60);
    assert.equal(seven.batchRuby, 140);
    assert.ok(seven.selected.ruby > three.selected.ruby);
  }
});
