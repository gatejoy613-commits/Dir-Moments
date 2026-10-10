import type { Lang } from "@/lib/catalog";
import { addDays, ethMonthName, parseIso, toEthiopian, weekday } from "@/lib/ethiopian";

const WD = { en: ["S", "M", "T", "W", "T", "F", "S"], am: ["እ", "ሰ", "ማ", "ረ", "ሐ", "ዓ", "ቅ"] };
const GM = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Month grids showing Gregorian day numbers with the Ethiopian date underneath.
 * When `toggleAction` is given, each day is a button that submits a form (vendor availability editing).
 */
export function Calendar({
  start, days, busy, lang, toggleAction,
}: { start: string; days: number; busy: string[]; lang: Lang; toggleAction?: (fd: FormData) => Promise<void> }) {
  const busySet = new Set(busy);
  const months: { key: string; days: string[] }[] = [];
  for (let i = 0; i < days; i++) {
    const iso = addDays(start, i);
    const key = iso.slice(0, 7);
    if (!months.length || months[months.length - 1].key !== key) months.push({ key, days: [] });
    months[months.length - 1].days.push(iso);
  }
  return (
    <div className="stack">
      {months.map((m) => {
        const first = parseIso(m.days[0]);
        const e1 = toEthiopian(first.y, first.m, first.d);
        const last = parseIso(m.days[m.days.length - 1]);
        const e2 = toEthiopian(last.y, last.m, last.d);
        const ethTitle = e1.month === e2.month
          ? `${ethMonthName(e1.month, lang)} ${e1.year}`
          : `${ethMonthName(e1.month, lang)} – ${ethMonthName(e2.month, lang)} ${e2.year}`;
        return (
          <div key={m.key}>
            <div className="spread small"><b>{GM[first.m - 1]} {first.y}</b><span className="muted">{ethTitle}</span></div>
            <div className="cal">
              {WD[lang].map((w, i) => <div key={i} className="wd">{w}</div>)}
              {Array.from({ length: weekday(m.days[0]) }).map((_, i) => <div key={`p${i}`} className="d pad" />)}
              {m.days.map((iso) => {
                const { y, m: mo, d } = parseIso(iso);
                const e = toEthiopian(y, mo, d);
                const cls = `d${busySet.has(iso) ? " busy" : ""}`;
                const inner = (<><div className="g">{d}</div><div className="e">{e.day}</div></>);
                return toggleAction ? (
                  <form key={iso} action={toggleAction}>
                    <input type="hidden" name="day" value={iso} />
                    <button className={cls} type="submit" title={iso}>{inner}</button>
                  </form>
                ) : (
                  <div key={iso} className={cls} title={iso}>{inner}</div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
