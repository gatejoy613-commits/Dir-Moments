import { headers } from "next/headers";
import { one, q } from "./db";

// Fixed-window rate limits, counted in Postgres.
//
// Netlify runs the app as many short-lived function instances, so a counter
// kept in memory would reset on every cold start and never be shared between
// instances. The database is the one place every instance sees.
//
// A failed check lets the request through: if the database is down the action
// fails anyway, and a limiter must never be the thing that locks people out.

export const BUSY = {
  en: "Too many attempts. Wait a few minutes and try again.",
  am: "ብዙ ሙከራ ተደርጓል። ጥቂት ደቂቃ ቆይተው እንደገና ይሞክሩ።",
} as const;

/** The visitor's IP as Netlify reports it, falling back to the usual proxy headers. */
export async function clientIp() {
  const h = await headers();
  return (
    h.get("x-nf-client-connection-ip") ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Counts one attempt against `key` and says whether it is still within `limit`
 * attempts per `windowSeconds`. Windows are aligned to the clock, so a burst
 * across a window edge can reach twice the limit; that is fine for abuse
 * control and keeps it to one row per key per window.
 */
export async function allow(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const row = await one<{ n: number }>(
      `INSERT INTO rate_limits (key, window_start, n)
       VALUES ($1, to_timestamp(floor(extract(epoch FROM now()) / $2) * $2), 1)
       ON CONFLICT (key, window_start) DO UPDATE SET n = rate_limits.n + 1
       RETURNING n`,
      [key.slice(0, 200), windowSeconds],
    );
    // Old windows are useless; clear them out now and then rather than on a schedule.
    if (Math.random() < 0.02) {
      q("DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'").catch(() => {});
    }
    return (row?.n ?? 0) <= limit;
  } catch (err) {
    console.error("rate limit check failed; letting the request through", err);
    return true;
  }
}

/** True when every check passes. Each check still counts, so all keys see the attempt. */
export async function allowAll(...checks: [key: string, limit: number, windowSeconds: number][]) {
  const results = await Promise.all(checks.map(([k, l, w]) => allow(k, l, w)));
  return results.every(Boolean);
}
