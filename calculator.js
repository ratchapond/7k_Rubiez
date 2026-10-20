(function (root) {
  "use strict";
  const modes = {
    normal: { label: "ฟาร์มปกติ", keys: 6, milestone: 160 },
    nightmare: { label: "ฟาร์มฝันร้าย", keys: 12, milestone: 80 }
  };
  const fixed = Object.freeze({ keysPerBox: 60, targetExp: 12500, rubyPerHero: 20, bonusKeys: 20 });
  const defaults = Object.freeze({
    mode: "normal", paidBoxes: 120, freeBoxes: 1, days: 8, heroesPerRun: 5,
    exp: 1200, keyPass: false, extraKeys: 110, monthly: true, ...fixed
  });
  function calculate(input) {
    const p = { ...defaults, ...input, ...fixed };
    if (!modes[p.mode]) throw new Error("กรุณาเลือกโหมดฟาร์ม");
    for (const key of Object.keys(defaults)) {
      if (typeof defaults[key] !== "number") continue;
      const positive = ["keysPerBox", "exp", "targetExp", "heroesPerRun"].includes(key);
      if (!Number.isSafeInteger(p[key]) || p[key] < (positive ? 1 : 0) || p[key] > 1000000)
        throw new Error("กรอกจำนวนเต็ม 0–1,000,000 โดย EXP และจำนวนมอนต่อรอบต้องมากกว่า 0");
    }
    const mode = modes[p.mode];
    const tier50 = Math.min(p.paidBoxes, 20);
    const tier80 = Math.min(Math.max(p.paidBoxes - 20, 0), 50);
    const tier100 = Math.max(p.paidBoxes - 70, 0);
    const dailyCost = tier50 * 50 + tier80 * 80 + tier100 * 100;
    const cost = dailyCost * p.days;
    const boxKeys = (p.paidBoxes + p.freeBoxes) * p.keysPerBox;
    const regenMinutes = p.keyPass ? 2 : 3;
    const dailyKeys = 1440 / regenMinutes;
    const totalKeys = (boxKeys + dailyKeys + p.extraKeys) * p.days;
    const baseRuns = Math.floor(totalKeys / mode.keys);
    // Preserve workbook B29/B30: bonus is awarded from base runs once, not recursively.
    const awards = Math.floor(baseRuns / mode.milestone);
    const bonus = awards * p.bonusKeys;
    const runs = Math.floor((totalKeys + bonus) / mode.keys);
    const scenario = monthly => {
      // Integer ratio avoids floating-point errors at exact EXP boundaries.
      const exp = p.exp * (monthly ? 110 : 100) / 100;
      const runsPerHero = Math.ceil(p.targetExp * 100 / (p.exp * (monthly ? 110 : 100)));
      // Preserve workbook B35/B36: pooled character progress, rounded down.
      const heroes = Math.floor(runs * p.heroesPerRun / runsPerHero);
      const ruby = heroes * p.rubyPerHero;
      return { exp, runsPerHero, heroes, ruby, profit: ruby - cost };
    };
    const without = scenario(false), withMonthly = scenario(true);
    const result = {
      mode, dailyKeys, regenMinutes, tier50, tier80, tier100, dailyCost, cost, boxKeys, totalKeys, baseRuns,
      awards, bonus, runs, remainingKeys: totalKeys + bonus - runs * mode.keys,
      without, withMonthly, selected: p.monthly ? withMonthly : without,
      batchRuby: p.heroesPerRun * p.rubyPerHero
    };
    if ([cost, totalKeys, runs * p.heroesPerRun, without.ruby, withMonthly.ruby, bonus]
      .some(n => !Number.isSafeInteger(n))) throw new Error("ค่ามากเกินช่วงคำนวณ กรุณาลดจำนวนลง");
    return result;
  }
  const api = { modes, fixed, defaults, calculate };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RubyCalc = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
