"use strict";
const { defaults, calculate, modes } = RubyCalc;
const form = document.querySelector("#settings");
const storageKey = "7k-rubiez-v1";
const nf = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 });
const text = (id, value) => { document.getElementById(id).textContent = value; };
function read() {
  const values = { mode: form.elements.mode.value, monthly: form.elements.monthly.checked, keyPass: form.elements.keyPass.checked };
  for (const [key, value] of Object.entries(defaults)) {
    if (typeof value === "number") values[key] = form.elements[key].value === "" ? NaN : Number(form.elements[key].value);
  }
  return values;
}
function fill(p) {
  form.elements.mode.value = p.mode;
  form.elements.monthly.checked = p.monthly;
  form.elements.keyPass.checked = p.keyPass;
  for (const [key, value] of Object.entries(defaults)) if (typeof value === "number") form.elements[key].value = p[key];
}
function render() {
  const p = read();
  const error = document.getElementById("error");
  for (const el of form.querySelectorAll("input[type=number]")) el.setAttribute("aria-invalid", String(!el.validity.valid));
  try {
    const r = calculate(p);
    form.elements.dailyKeys.value = r.dailyKeys;
    text("pass-note", `ฟื้นฟู 1 ดอกทุก ${r.regenMinutes} นาที · ${r.dailyKeys} ดอก/วัน`);
    error.hidden = true;
    document.getElementById("result-content").hidden = false;
    text("mode-note", `${r.mode.label}: รับ ${nf.format(p.bonusKeys)} กุญแจทุก ${r.mode.milestone} รอบ · ${nf.format(r.batchRuby)} รูบี้ต่อชุดเมื่อตัน`);
    text("period", `${nf.format(p.days)} วัน`);
    text("profit", (r.selected.profit > 0 ? "+" : "") + nf.format(r.selected.profit));
    document.getElementById("profit").classList.toggle("negative", r.selected.profit < 0);
    text("profit-note", `${r.mode.label} · ${p.monthly ? "ใช้บัฟ EXP +10%" : "ไม่ใช้บัฟรายเดือน"} · ยอดรวมตลอดช่วงฟาร์ม`);
    for (const [id, val] of Object.entries({
      gross: r.selected.ruby, cost: r.cost, runs: r.runs, heroes: r.selected.heroes,
      without: r.without.profit, with: r.withMonthly.profit,
      difference: r.withMonthly.profit - r.without.profit
    })) text(id, nf.format(val));
    text("rounds-per-hero", `${nf.format(r.selected.runsPerHero)} รอบจนตันต่อตัว`);
    text("box-keys", `${nf.format(r.boxKeys)} ดอก`);
    text("total-keys", `${nf.format(r.totalKeys)} ดอก`);
    text("base-runs", `${nf.format(r.baseRuns)} รอบ`);
    text("bonus-label", `โบนัส ${nf.format(r.awards)} ครั้ง (ทุก ${r.mode.milestone} รอบ)`);
    text("bonus", `+${nf.format(r.bonus)} ดอก`);
    text("remaining", `${nf.format(r.remainingKeys)} ดอก`);
    text("actual-exp", `${nf.format(r.selected.exp)} EXP`);
    try {
      localStorage.setItem(storageKey, JSON.stringify(p));
      text("save-status", "บันทึกค่าล่าสุดในเบราว์เซอร์นี้แล้ว");
    } catch { text("save-status", "คำนวณได้ แต่เบราว์เซอร์ไม่อนุญาตให้บันทึกค่า"); }
  } catch (e) {
    error.textContent = e.message;
    error.hidden = false;
    document.getElementById("result-content").hidden = true;
  }
}
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && modes[saved.mode] && typeof saved.monthly === "boolean") {
    calculate({ ...defaults, ...saved });
    fill({ ...defaults, ...saved });
  }
} catch { /* Invalid or unavailable storage: use workbook defaults. */ }
form.addEventListener("input", render);
form.addEventListener("submit", e => e.preventDefault());
document.getElementById("reset").addEventListener("click", () => { fill(defaults); render(); });
render();
