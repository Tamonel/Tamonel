// Counts my commits in local clones of repos GitHub.com cannot see (Wakandi's
// GitHub Enterprise server) and saves them to data/elsewhere.json, which
// fetch-stats.mjs adds to the GitHub.com numbers.
//
//   node scripts/count-local.mjs --author motachi ../jamii-super-app [more repos...]
//
// Run it by hand now and then; the nightly workflow cannot reach those servers
// and keeps the last saved file. Per commit only the day, a short fingerprint
// and line counts are saved: no repo names, paths or messages.

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fingerprint, nairobiDay, SKIP_FILES } from "./shared.mjs";

const args = process.argv.slice(2);
const at = args.indexOf("--author");
const author = at >= 0 ? args.splice(at, 2)[1] : null;
if (!author || !args.length) {
  console.error("Usage: node scripts/count-local.mjs --author <name or email pattern> <repo path>...");
  process.exit(1);
}

const since = new Date();
since.setUTCFullYear(since.getUTCFullYear() - 1);

const commits = new Map();
for (const repo of args) {
  // Every branch, so work still in review counts too. A commit that was
  // rebased or cherry-picked keeps its fingerprint and is counted once.
  const log = execFileSync(
    "git",
    ["-C", repo, "log", "--branches", "--remotes", "--no-merges", "-i", `--author=${author}`,
      `--since=${since.toISOString()}`, "--numstat", "--format=@@%aI%x09%s"],
    { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  );
  let current = null;
  for (const line of log.split("\n")) {
    if (line.startsWith("@@")) {
      const [date, subject] = line.slice(2).split("\t");
      const k = fingerprint(date, subject);
      current = commits.has(k) ? null : { k, d: nairobiDay(date), a: 0, r: 0 };
      if (current) commits.set(k, current);
      continue;
    }
    const m = current && line.match(/^(\d+)\t(\d+)\t(.+)$/);
    if (m && !SKIP_FILES.test(m[3])) {
      current.a += Number(m[1]);
      current.r += Number(m[2]);
    }
  }
}

const list = [...commits.values()].sort((a, b) => a.d.localeCompare(b.d) || a.k.localeCompare(b.k));
const body = list.map((c) => `  ${JSON.stringify(c)}`).join(",\n");
writeFileSync(
  "data/elsewhere.json",
  `{\n "updated": "${new Date().toISOString().slice(0, 10)}",\n "repos": ${args.length},\n "commits": [\n${body}\n ]\n}\n`,
);
console.log(`${list.length} commits from ${args.length} repo(s) → data/elsewhere.json`);
