import { toEthiopian, fromEthiopian } from "../lib/ethiopian";
const cases: [number, number, number, string][] = [
  [2026, 9, 11, "2019-1-1"], [2027, 9, 12, "2020-1-1"], [2027, 1, 7, "2019-4-29"], [2024, 9, 11, "2017-1-1"], [2026, 10, 10, "2019-1-30"],
];
let ok = true;
for (const [y, m, d, want] of cases) {
  const e = toEthiopian(y, m, d);
  const got = `${e.year}-${e.month}-${e.day}`;
  const back = fromEthiopian(e.year, e.month, e.day);
  const rt = back.year === y && back.month === m && back.day === d;
  console.log(`${y}-${m}-${d} -> ${got} (want ${want}) roundtrip ${rt}`);
  if (got !== want || !rt) ok = false;
}
process.exit(ok ? 0 : 1);
