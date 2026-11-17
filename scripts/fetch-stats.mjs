// Collects the numbers the profile cards draw and saves them to data/stats.json.
//
//   GH_TOKEN=$(gh auth token) node scripts/fetch-stats.mjs     (locally)
//
// In GitHub Actions the workflow passes the PROFILE_TOKEN secret. The token must
// belong to this account and carry the `repo` and `read:user` scopes (plus
// `read:org` for organisation repos), so private work is counted. Every call
// here only reads.
//
// The numbers are my commits, counted repo by repo, rather than GitHub's
// contribution calendar: the calendar leaves out private work unless a profile
// setting is on, and never sees other servers. Commits on Wakandi's GitHub
// Enterprise come from data/elsewhere.json (see count-local.mjs).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { BULK_LINES, fingerprint, nairobiDay } from "./shared.mjs";

const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("No token. Locally run: GH_TOKEN=$(gh auth token) npm run stats");
  process.exit(1);
}

const OUT = "data/stats.json";
const saved = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const elsewhere = existsSync("data/elsewhere.json")
  ? JSON.parse(readFileSync("data/elsewhere.json", "utf8"))
  : { repos: 0, commits: [] };

const headers = {
  Authorization: `bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "tamonel-profile-cards",
};

async function graphql(query, variables = {}) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors) throw new Error(JSON.stringify(body.errors));
  return body.data;
}

const now = new Date();
const today = nairobiDay(now);
const from = new Date(now);
from.setUTCFullYear(now.getUTCFullYear() - 1);
const recentFrom = new Date(now);
recentFrom.setUTCDate(now.getUTCDate() - 60);

// ---------------------------------------------------------------- me

const { viewer } = await graphql(`{
  viewer { id login createdAt repositories(ownerAffiliations: OWNER) { totalCount } }
}`);
const login = viewer.login;

// ---------------------------------------------------------------- repos

// Every repo this token can see that I committed to this year: my own,
// collaborations and organisation repos. Forks and this profile repo are left
// out, since their commits are copies or the cards themselves.
const repos = [];
for (let after = null; ; ) {
  const page = await graphql(
    `query ($id: ID!, $since: GitTimestamp!, $recent: GitTimestamp!, $after: String) {
      viewer {
        repositories(first: 50, after: $after,
          affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER],
          ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) {
          pageInfo { hasNextPage endCursor }
          nodes {
            nameWithOwner isFork
            languages(first: 12, orderBy: { field: SIZE, direction: DESC }) {
              edges { size node { name color } }
            }
            defaultBranchRef { target { ... on Commit {
              year: history(author: { id: $id }, since: $since) { totalCount }
              recent: history(author: { id: $id }, since: $recent) { totalCount }
            } } }
          }
        }
      }
    }`,
    { id: viewer.id, since: from.toISOString(), recent: recentFrom.toISOString(), after },
  );
  const { nodes, pageInfo } = page.viewer.repositories;
  for (const r of nodes) {
    const c = r.defaultBranchRef?.target;
    if (r.isFork || !c?.year.totalCount) continue;
    if (r.nameWithOwner.toLowerCase() === `${login}/${login}`.toLowerCase()) continue;
    repos.push({ repo: r, commits: c.year.totalCount, recent: c.recent.totalCount });
  }
  if (!pageInfo.hasNextPage) break;
  after = pageInfo.endCursor;
}

// ---------------------------------------------------------------- commits

const commits = new Map();
for (const { repo } of repos) {
  const [owner, name] = repo.nameWithOwner.split("/");
  for (let after = null; ; ) {
    const page = await graphql(
      `query ($owner: String!, $name: String!, $id: ID!, $since: GitTimestamp!, $after: String) {
        repository(owner: $owner, name: $name) { defaultBranchRef { target { ... on Commit {
          history(author: { id: $id }, since: $since, first: 100, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes { authoredDate messageHeadline additions deletions parents { totalCount } }
          }
        } } } }
      }`,
      { owner, name, id: viewer.id, since: from.toISOString(), after },
    );
    const history = page.repository.defaultBranchRef.target.history;
    for (const c of history.nodes) {
      if (c.parents.totalCount > 1) continue; // merge commits repeat other work
      const k = fingerprint(c.authoredDate, c.messageHeadline);
      if (!commits.has(k)) {
        const s = owner.toLowerCase() === login.toLowerCase() ? "personal" : "team";
        commits.set(k, { d: nairobiDay(c.authoredDate), a: c.additions, r: c.deletions, s });
      }
    }
    if (!history.pageInfo.hasNextPage) break;
    after = history.pageInfo.endCursor;
  }
}
const onGitHub = commits.size;
const firstDay = nairobiDay(from);
for (const c of elsewhere.commits) {
  // Everything counted locally is team work at Wakandi.
  if (c.d >= firstDay && !commits.has(c.k)) commits.set(c.k, { d: c.d, a: c.a, r: c.r, s: "team" });
}

// ---------------------------------------------------------------- days

const perDay = {};
for (const c of commits.values()) perDay[c.d] = (perDay[c.d] || 0) + 1;
const days = [];
for (let t = new Date(`${firstDay}T00:00:00Z`); ; t.setUTCDate(t.getUTCDate() + 1)) {
  const date = t.toISOString().slice(0, 10);
  if (date > today) break;
  days.push({ date, count: perDay[date] || 0 });
}

const active = days.filter((d) => d.count > 0);
const bestDay = days.reduce((a, b) => (b.count > a.count ? b : a), days[0]);
let longest = 0;
for (let run = 0, i = 0; i < days.length; i++) {
  run = days[i].count ? run + 1 : 0;
  longest = Math.max(longest, run);
}
// Today is not over yet, so an empty today does not break the streak.
let current = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].count) current++;
  else if (i !== days.length - 1) break;
}
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const byDow = Object.fromEntries(DOW.map((d) => [d, 0]));
const byMonth = {};
for (const d of days) {
  byDow[DOW[new Date(`${d.date}T00:00:00Z`).getUTCDay()]] += d.count;
  byMonth[d.date.slice(0, 7)] = (byMonth[d.date.slice(0, 7)] || 0) + d.count;
}

// ---------------------------------------------------------------- lines

const lines = { added: 0, removed: 0, bulkSkipped: 0, byMonth: {} };
for (const c of commits.values()) {
  if (c.a + c.r > BULK_LINES) {
    lines.bulkSkipped++;
    continue;
  }
  const m = c.d.slice(0, 7);
  lines.added += c.a;
  lines.removed += c.r;
  lines.byMonth[m] ??= { added: 0, removed: 0 };
  lines.byMonth[m].added += c.a;
  lines.byMonth[m].removed += c.r;
}

// ---------------------------------------------------------------- pull requests

const prs = await graphql(
  `query ($all: String!, $merged: String!) {
    all: search(query: $all, type: ISSUE, first: 0) { issueCount }
    merged: search(query: $merged, type: ISSUE, first: 0) { issueCount }
  }`,
  { all: `author:${login} is:pr`, merged: `author:${login} is:pr is:merged` },
);

// ---------------------------------------------------------------- languages

// Each GitHub.com repo's language mix, weighted by how many commits I made
// there, so a repo I work in daily counts for more than a big one I touched once.
function languageMix(weight) {
  const total = {};
  const color = {};
  for (const r of repos) {
    const edges = r.repo.languages.edges;
    const size = edges.reduce((s, e) => s + e.size, 0);
    const w = weight(r);
    if (!size || !w) continue;
    for (const e of edges) {
      total[e.node.name] = (total[e.node.name] || 0) + (e.size / size) * w;
      color[e.node.name] = e.node.color;
    }
  }
  const sum = Object.values(total).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(total)
    .map(([name, v]) => ({ name, pct: +((v / sum) * 100).toFixed(1), color: color[name] }))
    .sort((a, b) => b.pct - a.pct);
}

// ---------------------------------------------------------------- achievements

// There is no API for achievements, so read the public profile page. If that
// fails, keep the list saved last time.
let achievements = saved.achievements ?? [];
try {
  const html = await (
    await fetch(`https://github.com/${login}?tab=achievements`, {
      headers: { "User-Agent": "tamonel-profile-cards" },
    })
  ).text();
  const found = [];
  for (const m of html.matchAll(/alt="Achievement: ([^"]+)"[\s\S]{0,1500}?(?=alt="Achievement: |$)/g)) {
    const name = m[1].trim();
    if (found.some((a) => a.name === name)) continue;
    const tier = m[0].match(/achievement-tier-label[^>]*>\s*x(\d+)/);
    found.push({ name, tier: tier ? Number(tier[1]) : 1 });
  }
  if (found.length) achievements = found;
} catch (err) {
  console.warn(`Achievements kept from last run: ${err.message}`);
}

// ---------------------------------------------------------------- save

const stats = {
  login,
  updated: today,
  memberSince: viewer.createdAt.slice(0, 10),
  commits: commits.size,
  commitsOnGitHub: onGitHub,
  commitsElsewhere: commits.size - onGitHub,
  bySource: {
    team: [...commits.values()].filter((c) => c.s === "team").length,
    personal: [...commits.values()].filter((c) => c.s === "personal").length,
  },
  elsewhereUpdated: elsewhere.updated ?? null,
  pullRequests: prs.all.issueCount,
  pullRequestsMerged: prs.merged.issueCount,
  repositories: viewer.repositories.totalCount,
  reposThisYear: repos.length + (elsewhere.repos || 0),
  activeDays: active.length,
  firstActive: active[0]?.date ?? null,
  bestDay,
  streak: { current, longest },
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => [d, byDow[d]]),
  months: Object.entries(byMonth).map(([month, count]) => ({ month, count })),
  days,
  languages: languageMix((r) => r.commits).slice(0, 7),
  recentLanguages: languageMix((r) => r.recent).slice(0, 4),
  lines,
  achievements,
};

mkdirSync("data", { recursive: true });
writeFileSync(OUT, `${JSON.stringify(stats, null, 1)}\n`);
console.log(
  `${login}: ${stats.commits} commits (${onGitHub} on GitHub.com, ${stats.commitsElsewhere} elsewhere) ` +
    `in ${stats.reposThisYear} repos, ${stats.activeDays} active days, streak ${current}/${longest}, ` +
    `${stats.pullRequestsMerged}/${stats.pullRequests} PRs merged, +${lines.added}/-${lines.removed} lines ` +
    `(${lines.bulkSkipped} bulk commits left out), ${achievements.length} achievements`,
);
