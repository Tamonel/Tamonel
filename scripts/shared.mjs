// Helpers both stats scripts use, so a commit seen on two servers matches.

import { createHash } from "node:crypto";

/** A short id for a commit from its author time and subject, not its hash,
 *  so a rebased or cherry-picked copy gets the same id. */
export function fingerprint(authoredAt, subject) {
  const seconds = Math.floor(new Date(authoredAt).getTime() / 1000);
  const words = String(subject).trim().slice(0, 50);
  return createHash("sha1").update(`${seconds}|${words}`).digest("hex").slice(0, 12);
}

/** The calendar day in Nairobi (UTC+3, no daylight saving). */
export function nairobiDay(when) {
  return new Date(new Date(when).getTime() + 3 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Commits this large are imports, moves or generated files, not a day's work.
 *  They still count as commits, but not towards lines changed. */
export const BULK_LINES = 5000;

/** Files whose changes say nothing about the work. */
export const SKIP_FILES =
  /(^|\/)(package-lock\.json|bun\.lockb?|yarn\.lock|pnpm-lock\.yaml|[^/]+\.min\.(js|css)|[^/]+\.map)$|(^|\/)(dist|build|\.next)\//;
