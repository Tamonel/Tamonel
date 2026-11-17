// Draws every card on the profile, once for GitHub's light theme and once for
// its dark theme, then refreshes the live blocks in README.md.
//
//   npm install                                   (once)
//   GH_TOKEN=$(gh auth token) npm run stats       (optional: fresh numbers)
//   npm run cards
//
// The words on the cards are written by hand below. Every number comes from
// data/stats.json, which the nightly workflow refreshes.
//
// The look: cosmic mocha. Espresso-dark surfaces and cream text, purple leading,
// muted bronze as the warm second colour, and cyan and magenta kept for small
// accents (the portal's core, the comet, whatever is "now"). A spinning portal
// in the header, and the year drawn as a spiral galaxy.
// Type is Space Grotesk, with JetBrains Mono for labels and figures.
//
// GitHub shows README images without web fonts, so each card carries the
// fonts it needs, cut down to the characters the cards use. Motion is CSS
// inside the SVG, and it all stops for people who ask for reduced motion.
// Fonts: SIL Open Font License (fonts/OFL-*.txt).
//
// The idea of drawn, theme-aware profile cards comes from the profile of
// MWANZIAMUTINDA, whose cards were built with unslop by Damir Sokolovsky
// (CC BY 4.0). This code and design are new.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import subsetFont from "subset-font";

const DATA = JSON.parse(readFileSync("data/stats.json", "utf8"));

// ---------------------------------------------------------------- words

const HEADER = {
  name: "MOTACHI KELVIN MOGIRE",
  kicker: "FULL-STACK DEVELOPER  ·  NAIROBI, KENYA",
  line: "Building automation tools for African markets",
  focus: "SACCOs · chamas · MFIs · M-Pesa · AI",
};

// What the header types out, one after another. Keep each short.
const NOW_BUILDING = [
  "Jamii Studio at Wakandi",
  "CRB Lookup at Wakandi",
  "Expert RN Scholars, Phase 1",
  "MemberPulse",
];

const EMAIL = "motachikelvin@gmail.com";

// group: wakandi | client | personal | learning (sets the card's colour)
const PROJECTS = [
  {
    file: "jamii-studio",
    wide: true,
    group: "wakandi",
    meta: "Wakandi · Jamii platform",
    title: "Jamii Studio",
    status: "Shipping · Nov 2026",
    lines: [
      "A website builder for SACCOs, MFIs and chamas. A five-step wizard that can start from the Super Jamii",
      "sign-up, photos and logos made by AI and checked before use, sites in English or Kiswahili at their own",
      "address, members' stories, and join requests that go straight into CAMS.",
    ],
    stack: ["Next.js", "TypeScript", "Supabase", "Claude", "OpenRouter", "Render"],
  },
  {
    file: "crb-lookup",
    group: "wakandi",
    meta: "Wakandi · Jamii platform",
    title: "CRB Lookup",
    status: "Shipped Oct 2026",
    lines: [
      "Credit-bureau checks before a loan: the lookup",
      "engine, result screens, a KES ledger with M-Pesa",
      "top-ups, roles, spending limits and an audit log.",
    ],
    stack: ["Next.js", "Supabase", "Postgres RLS", "M-Pesa"],
  },
  {
    file: "jamii-connect",
    group: "wakandi",
    meta: "Wakandi · Jamii platform",
    title: "Jamii Connect",
    status: "Live",
    lines: [
      "SMS and a member register for groups. I built",
      "the fraud controls that hold scam-shaped campaigns,",
      "sender-ID review and audited staff access.",
    ],
    stack: ["Next.js", "Supabase", "Postgres", "SMS"],
  },
  {
    file: "waypoint",
    group: "wakandi",
    meta: "Wakandi · WGT portal",
    title: "Waypoint",
    status: "Shipped Aug 2026",
    lines: [
      "The sales CRM in Wakandi's portal: orders,",
      "quotes with their lines, the master price list",
      "and each company's country in the header.",
    ],
    stack: ["Next.js 15", "React Query", "Directus"],
  },
  {
    file: "sacco-web",
    group: "wakandi",
    meta: "Wakandi · AI agent skill",
    title: "SACCO website skill",
    status: "Shipped Nov 2026",
    lines: [
      "An agent skill that writes a SACCO, MFI or chama",
      "website: colours from the logo, M-Pesa, forms,",
      "FAQs, WhatsApp, Kiswahili. It never invents figures.",
    ],
    stack: ["Claude Code", "Skills", "HTML", "CSS"],
  },
  {
    file: "sheria-ai",
    wide: true,
    group: "personal",
    meta: "Final-year project · legal tech",
    title: "Sheria AI",
    status: "Capstone · 2026",
    lines: [
      "Free legal help in English and Kiswahili for landlord and tenant disputes in Kenya: eviction, rent, deposits.",
      "Seven Docker services, from design to user testing in 30 days. A LangChain pipeline over ChromaDB has Claude",
      "answer from the statutes with citations, behind JWT APIs, SMS one-time codes, M-Pesa billing and PDF letters.",
    ],
    stack: ["Django", "FastAPI", "LangChain", "ChromaDB", "Claude", "React PWA", "Docker", "M-Pesa", "Africa's Talking"],
  },
  {
    file: "expert-rn-scholars",
    group: "client",
    meta: "Client · education",
    title: "Expert RN Scholars",
    status: "Phase 1 · Nov 2026",
    lines: [
      "NCLEX-RN prep for nursing graduates: the public",
      "site, enrollment requests, WhatsApp on every page",
      "and an admin dashboard that runs the content.",
    ],
    stack: ["Next.js", "Payload CMS", "Postgres", "Playwright"],
  },
  {
    file: "memberpulse",
    group: "personal",
    meta: "Personal · SaaS",
    title: "MemberPulse",
    status: "In development",
    lines: [
      "A member register and SMS outreach for SACCOs,",
      "MFIs and co-ops: CSV import, tags, campaigns,",
      "delivery status, SMS credits and team invites.",
    ],
    stack: ["Next.js", "Supabase", "Postgres RLS", "SMS"],
  },
  {
    file: "ea-outreach",
    group: "personal",
    meta: "Personal · automation",
    title: "EA Outreach Automation",
    status: "Runs daily",
    lines: [
      "Finds remote assistant jobs every morning, filters",
      "them for free, has an LLM write a tailored note,",
      "and logs each one to a Google Sheet.",
    ],
    stack: ["Python", "Gemini", "GitHub Actions", "Sheets"],
  },
  {
    file: "jaclang-game",
    group: "learning",
    meta: "Moringa School · AI capstone",
    title: "Jaclang Number Game",
    status: "Open source",
    lines: [
      "A beginner's toolkit for Jaclang: learn the",
      "language by building an interactive number-",
      "guessing game, one step at a time.",
    ],
    stack: ["Jaclang", "Python"],
  },
];

// [issuer, title, detail, tone]
const CERTS = [
  ["Google Cloud", "Cybersecurity Certificate", "Launchpad Scholarship · 2026", "violet"],
  ["Amazon Web Services", "Cloud Practitioner", "AWS Certified · 2024", "violet"],
  ["IBM", "Cybersecurity Fundamentals", "2025", "violet"],
  ["ALX Africa", "Backend Development", "2025", "violet"],
  ["Moringa School", "AI Essentials", "for Software Engineers · 2025", "violet"],
  ["Google", "Web Development", "Google Developer · 2024", "violet"],
  ["ALX Africa", "Professional Foundations", "2025", "violet"],
  ["ALX Africa", "Virtual Assistance", "2024", "violet"],
  ["Safaricom", "Enterprise Customer Support", "Internship certificate · 2025", "violet"],
];

// Where I have been, left to right. The last stop is now.
const JOURNEY = [
  ["2022", "BSc Computer Science", "Co-operative University"],
  ["2024", "ALX Africa", "Back-end, peer mentor"],
  ["Oct 2025", "Safaricom", "Infrastructure intern"],
  ["2026", "Graduated", "Capstone: Sheria AI"],
  ["Aug 2026", "Wakandi", "Full-stack developer"],
];

// Favourite shows and characters. Portraits are in assets/characters/.
const SHOWS = [
  {
    title: "Entergalactic",
    sub: "Kid Cudi · Netflix, 2022",
    tone: "pink",
    cast: [
      ["jabari.jpg", "Jabari"],
      ["meadow.jpg", "Meadow"],
      ["jimmy.jpg", "Jimmy"],
      ["ky.jpg", "Ky"],
      ["carmen.jpg", "Carmen"],
    ],
  },
  {
    title: "Rick and Morty",
    sub: "Adult Swim, since 2013",
    tone: "cyan",
    cast: [
      ["rick.jpg", "Rick"],
      ["morty.jpg", "Morty"],
      ["pickle-rick.jpg", "Pickle Rick"],
      ["meeseeks.jpg", "Mr. Meeseeks"],
      ["evil-morty.jpg", "Evil Morty"],
    ],
  },
];

const CONTACT = {
  title: "Let's build for African markets",
  lines: [
    "Open to anything that fits: automation, fintech for SACCOs and chamas,",
    "AI tools, and the people building for this continent.",
  ],
};

// ---------------------------------------------------------------- look

const THEMES = {
  dark: {
    surface: "#151015",
    band: "#1e161c",
    border: "#3a2c33",
    text: "#f6eee8",
    secondary: "#cdbcb4",
    muted: "#98847d",
    track: "#2a2026",
    pink: "#ff5fc8",
    violet: "#a07cff",
    lavender: "#cbb8ff",
    bronze: "#c8955f",
    mocha: "#6e4c3c",
    cyan: "#45e3ff",
    onAccent: "#151015",
    star: "#fff3e6",
    glow: 0.2,
    warm: 0.16,
    // Quiet to busy, for the galaxy and the grid: espresso, mocha, bronze,
    // purple, and magenta for the busiest days.
    levels: ["#2c2127", "#6e4c3c", "#b0814f", "#a07cff", "#ff5fc8"],
  },
  light: {
    surface: "#fdf9f5",
    band: "#f6eee6",
    border: "#e7d9cd",
    text: "#24161a",
    secondary: "#5c4840",
    muted: "#8a7468",
    track: "#f1e7de",
    pink: "#c81e8c",
    violet: "#6a3fd8",
    lavender: "#8b6ee8",
    bronze: "#9a6434",
    mocha: "#6e4c3c",
    cyan: "#0a7fa6",
    onAccent: "#ffffff",
    star: "#9a6434",
    glow: 0.1,
    warm: 0.1,
    levels: ["#efe4da", "#dcc3ab", "#b98b5f", "#7048dc", "#c81e8c"],
  },
};
// The dot in each project's status pill: cyan for Wakandi, magenta for my own.
const GROUP_DOT = { wakandi: "cyan", client: "pink", personal: "pink", learning: "lavender" };

const FONTS = {
  display: { file: "fonts/space-grotesk-latin-700-normal.woff2", family: "TDisplay", weight: 700,
    stack: "TDisplay, 'Space Grotesk', 'Segoe UI', Helvetica, Arial, sans-serif" },
  sans: { file: "fonts/space-grotesk-latin-400-normal.woff2", family: "TSans", weight: 400,
    stack: "TSans, 'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif" },
  mono: { file: "fonts/jetbrains-mono-latin-400-normal.woff2", family: "TMono", weight: 400,
    stack: "TMono, 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace" },
};
const D = `font-family="${FONTS.display.stack}" font-weight="700"`;
const M = `font-family="${FONTS.mono.stack}"`;
const MONO = 0.6; // JetBrains Mono advances 0.6em per character

const REDUCED = "@media (prefers-reduced-motion:reduce){*{animation:none!important}}";

// ---------------------------------------------------------------- helpers

const esc = (s) =>
  String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const fmt = (n) => n.toLocaleString("en-GB");
const kilo = (n) => (n >= 10000 ? `${Math.round(n / 1000)}k` : fmt(n));
const day = (iso, year = true) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}), timeZone: "UTC",
  });
const monthName = (ym, style = "long") =>
  new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: style, timeZone: "UTC" });
const n1 = (v) => +v.toFixed(1);

/** A small seeded random, so the stars sit still between builds. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Every card: rounded frame, neon edge along the top, soft glow top right. */
function frame(t, w, h, title, body, { css = "", defs = "" } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${FONTS.sans.stack}">
  <title>${esc(title)}</title>
  <style>/*FONTS*/${css}</style>
  <defs>
    <linearGradient id="edge" x1="0" x2="1"><stop offset="0" stop-color="${t.bronze}"/><stop offset=".3" stop-color="${t.violet}"/><stop offset=".88" stop-color="${t.violet}"/><stop offset="1" stop-color="${t.cyan}"/></linearGradient>
    <radialGradient id="glow" cx="1" cy="0" r="1"><stop offset="0" stop-color="${t.violet}" stop-opacity="${t.glow}"/><stop offset=".6" stop-color="${t.violet}" stop-opacity="0"/></radialGradient>
    <radialGradient id="warm" cx="0" cy="1" r="1"><stop offset="0" stop-color="${t.bronze}" stop-opacity="${t.warm}"/><stop offset=".65" stop-color="${t.bronze}" stop-opacity="0"/></radialGradient>
    <clipPath id="card"><rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="16"/></clipPath>
${defs}
  </defs>
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="16" fill="${t.surface}"/>
  <g clip-path="url(#card)">
    <rect x="${w * 0.45}" y="0" width="${w * 0.55}" height="${Math.min(h, 260)}" fill="url(#glow)"/>
    <rect x="0" y="${Math.max(0, h - 220)}" width="${w * 0.5}" height="${Math.min(h, 220)}" fill="url(#warm)"/>
    <rect x="0" y="0" width="${w}" height="3" fill="url(#edge)"/>
  </g>
${body}
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="16" fill="none" stroke="${t.border}"/>
</svg>
`;
}

/** A card's title on the left and a quiet note on the right. */
function heading(t, w, title, note = "") {
  return `  <text x="24" y="42" font-size="19" ${D} fill="${t.text}">${esc(title)}</text>
  <text x="${w - 24}" y="41" text-anchor="end" font-size="11" ${M} fill="${t.muted}">${esc(note)}</text>`;
}

/** A pill with a dot and mono text, right-aligned at `right`. */
function pill(t, right, y, text, tone, dot = tone) {
  const w = text.length * 11 * MONO + 30;
  const x = right - w;
  return `  <rect x="${n1(x)}" y="${y}" width="${n1(w)}" height="22" rx="11" fill="${t[tone]}" fill-opacity=".12" stroke="${t[tone]}" stroke-opacity=".55"/>
  <circle cx="${n1(x + 12)}" cy="${y + 11}" r="3" fill="${t[dot]}"/>
  <text x="${n1(x + 21)}" y="${y + 15}" font-size="11" ${M} fill="${t[tone]}">${esc(text)}</text>`;
}

/** Stack chips in a row from x. */
function chips(t, x, y, list) {
  let cx = x;
  return list
    .map((name) => {
      const w = name.length * 11 * MONO + 16;
      const out = `  <rect x="${n1(cx)}" y="${y}" width="${n1(w)}" height="22" rx="6" fill="${t.track}"/>
  <text x="${n1(cx + 8)}" y="${y + 15}" font-size="11" ${M} fill="${t.secondary}">${esc(name)}</text>`;
      cx += w + 6;
      return out;
    })
    .join("\n");
}

/** Faint stars scattered over a box. Some of them twinkle. */
function stars(t, rand, count, box, { twinkle = 0 } = {}) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const x = box.x + rand() * box.w;
    const y = box.y + rand() * box.h;
    const r = 0.4 + rand() * 1.1;
    const o = 0.25 + rand() * 0.6;
    const tw = i < twinkle ? ` class="tw" style="animation-delay:${(rand() * 4).toFixed(2)}s"` : "";
    out.push(`<circle${tw} cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" fill="${t.star}" fill-opacity="${o.toFixed(2)}"/>`);
  }
  return `  <g>${out.join("")}</g>`;
}
const TWINKLE = ".tw{animation:tw 4s ease-in-out infinite}@keyframes tw{50%{opacity:.15}}";

// ---------------------------------------------------------------- header

/** Name over a starfield, a portal spinning on the right, and a console bar
 *  that types out what I'm building now. */
function headerCard(t) {
  const w = 860;
  const h = 236;
  const bandY = 172;
  const px = 742;
  const py = 92;

  // The ticker: each item is uncovered one character at a time by a
  // band-coloured cover that shrinks in steps, with a caret on its edge.
  const x = 214;
  const size = 13;
  const adv = size * MONO;
  const n = NOW_BUILDING.length;
  const slot = 100 / n;
  const cycle = n * 4;
  const p = (v) => `${+v.toFixed(2)}%`;
  let css = `${TWINKLE}.cur{animation:blink 1s steps(1,end) infinite}@keyframes blink{50%{opacity:0}}`;
  css += `.spin{animation:spin var(--d) linear infinite}.rev{animation-direction:reverse}@keyframes spin{to{transform:rotate(360deg)}}`;
  css += `.pulse{animation:pulse 3s ease-in-out infinite}@keyframes pulse{50%{opacity:.55}}`;
  const items = NOW_BUILDING.map((item, i) => {
    const width = item.length * adv;
    const s = i * slot;
    const typed = s + slot * 0.3;
    const hold = s + slot * 0.82;
    const gone = s + slot * 0.96;
    const steps = `animation-timing-function:steps(${item.length},end)`;
    css += `@keyframes show${i}{0%{opacity:${i ? 0 : 1}}${i ? `${p(s)}{opacity:1}` : ""}${p(s + slot)}{opacity:0}100%{opacity:0}}`;
    css += `@keyframes type${i}{0%,${p(s)}{transform:scaleX(1);${steps}}${p(typed)}{transform:scaleX(0);animation-timing-function:linear}${p(hold)}{transform:scaleX(0);${steps}}${p(gone)},100%{transform:scaleX(1)}}`;
    css += `@keyframes caret${i}{0%,${p(s)}{transform:translateX(0);${steps}}${p(typed)}{transform:translateX(${n1(width)}px);animation-timing-function:linear}${p(hold)}{transform:translateX(${n1(width)}px);${steps}}${p(gone)},100%{transform:translateX(0)}}`;
    css += `.i${i}{animation:show${i} ${cycle}s steps(1,end) infinite}.c${i}{transform-box:fill-box;transform-origin:100% 50%;animation:type${i} ${cycle}s infinite}.k${i}{animation:caret${i} ${cycle}s infinite}`;
    // Without motion, the first item shows, fully typed.
    return `  <g class="i${i}"${i ? ` opacity="0"` : ""}>
    <text x="${x}" y="${bandY + 38}" font-size="${size}" ${M} fill="${t.text}">${esc(item)}</text>
    <rect class="c${i}" x="${x - 1}" y="${bandY + 22}" width="${n1(width + 2)}" height="22" fill="${t.band}"${i ? "" : ` transform="scale(0 1)"`}/>
    <g class="k${i}"${i ? "" : ` transform="translate(${n1(width)} 0)"`}><rect class="cur" x="${x + 1}" y="${bandY + 25}" width="7" height="16" rx="1" fill="${t.pink}"/></g>
  </g>`;
  }).join("\n");

  // The portal: dashed rings turning at different speeds round a bright core.
  const rings = [
    [64, "6s", false, "38 14 6 14", 3],
    [52, "9s", true, "22 10 60 10", 2.5],
    [40, "5s", false, "16 8", 3],
    [28, "7s", true, "30 12", 2.5],
    [17, "3.5s", false, "10 6", 2],
  ]
    .map(
      ([r, d, rev, dash, sw], i) =>
        `    <circle class="spin${rev ? " rev" : ""}" style="--d:${d};transform-origin:${px}px ${py}px" cx="${px}" cy="${py}" r="${r}" fill="none" stroke="url(#ring${i % 3})" stroke-width="${sw}" stroke-dasharray="${dash}" stroke-linecap="round"/>`,
    )
    .join("\n");

  const defs = `    <linearGradient id="name" x1="32" x2="640" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${t.text}"/><stop offset=".45" stop-color="${t.text}"/><stop offset=".75" stop-color="${t.bronze}"/><stop offset="1" stop-color="${t.violet}"/></linearGradient>
    <linearGradient id="ring0" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.violet}"/><stop offset="1" stop-color="${t.lavender}"/></linearGradient>
    <linearGradient id="ring2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${t.bronze}"/><stop offset="1" stop-color="${t.violet}"/></linearGradient>
    <linearGradient id="ring1" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.violet}"/><stop offset=".7" stop-color="${t.violet}"/><stop offset="1" stop-color="${t.cyan}"/></linearGradient>
    <radialGradient id="core"><stop offset="0" stop-color="${t.star}" stop-opacity=".95"/><stop offset=".35" stop-color="${t.cyan}" stop-opacity=".7"/><stop offset="1" stop-color="${t.violet}" stop-opacity="0"/></radialGradient>
    <radialGradient id="halo"><stop offset="0" stop-color="${t.violet}" stop-opacity=".35"/><stop offset="1" stop-color="${t.violet}" stop-opacity="0"/></radialGradient>`;

  const rand = seeded(7);
  const body = `${stars(t, rand, 70, { x: 16, y: 12, w: w - 32, h: bandY - 24 }, { twinkle: 16 })}
  <circle cx="${px}" cy="${py}" r="96" fill="url(#halo)"/>
${rings}
  <circle class="pulse" cx="${px}" cy="${py}" r="20" fill="url(#core)"/>
  <text x="34" y="52" font-size="11.5" ${M} fill="${t.bronze}" letter-spacing="1.5">${esc(HEADER.kicker)}</text>
  <text x="32" y="106" font-size="43" ${D} fill="url(#name)" letter-spacing="0.5">${esc(HEADER.name)}</text>
  <text x="34" y="140" font-size="17" fill="${t.secondary}">${esc(HEADER.line)}</text>
  <rect x="0" y="${bandY}" width="${w}" height="${h - bandY}" fill="${t.band}" clip-path="url(#card)"/>
  <line x1="0" y1="${bandY + 0.5}" x2="${w}" y2="${bandY + 0.5}" stroke="${t.border}"/>
  <circle class="pulse" cx="38" cy="${bandY + 33}" r="4" fill="${t.pink}"/>
  <text x="50" y="${bandY + 38}" font-size="11.5" ${M} fill="${t.muted}" letter-spacing="1">NOW BUILDING</text>
  <text x="${x - 20}" y="${bandY + 38}" font-size="13" ${M} fill="${t.violet}">›</text>
${items}
  <text x="${w - 30}" y="${bandY + 38}" text-anchor="end" font-size="12.5" ${M} fill="${t.secondary}">${esc(HEADER.focus)}</text>`;
  return frame(t, w, h, HEADER.name, body, { css: css + REDUCED, defs });
}

// ---------------------------------------------------------------- stats

function statsCard(t) {
  const w = 860;
  const h = 156;
  const items = [
    { value: fmt(DATA.commits), label: "Commits", note: "last 12 months", lead: true },
    { value: `${DATA.pullRequestsMerged}`, label: "PRs merged", note: `of ${DATA.pullRequests} opened` },
    { value: `${DATA.streak.current}`, unit: DATA.streak.current === 1 ? "day" : "days", label: "Current streak", note: `longest ${DATA.streak.longest}` },
    { value: `+${kilo(DATA.lines.added)}`, label: "Lines added", note: `${kilo(DATA.lines.removed)} removed` },
    { value: fmt(DATA.activeDays), label: "Active days", note: `in ${DATA.reposThisYear} repos` },
  ];
  const col = (w - 48) / items.length;
  const css = `.n{animation:up .9s cubic-bezier(.2,.7,.2,1) both}@keyframes up{from{opacity:0;transform:translateY(10px)}}`;
  const cells = items
    .map((s, i) => {
      const x = 24 + i * col + (i ? 18 : 0);
      const divider = i ? `  <line x1="${24 + i * col}" y1="66" x2="${24 + i * col}" y2="134" stroke="${t.border}"/>\n` : "";
      const unit = s.unit
        ? `\n  <text class="n" style="animation-delay:${i * 90}ms" x="${n1(x + s.value.length * 22 + 6)}" y="116" font-size="16" fill="${t.secondary}">${s.unit}</text>`
        : "";
      return `${divider}  <text x="${x}" y="78" font-size="11" ${M} fill="${t.muted}" letter-spacing=".5">${esc(s.label.toUpperCase())}</text>
  <text class="n" style="animation-delay:${i * 90}ms" x="${x - 1}" y="116" font-size="36" ${D} fill="${s.lead ? t.violet : t.text}">${esc(s.value)}</text>${unit}
  <text x="${x}" y="136" font-size="12" fill="${t.muted}">${esc(s.note)}</text>`;
    })
    .join("\n");
  const body = `${heading(t, w, "GitHub at a glance", `private work included · updated ${day(DATA.updated)}`)}
${cells}`;
  return frame(t, w, h, "GitHub at a glance", body, { css: css + REDUCED });
}

// ---------------------------------------------------------------- projects

function projectCard(t, p) {
  const w = p.wide ? 860 : 420;
  const h = p.wide ? 220 : 226;
  const dot = GROUP_DOT[p.group];
  const right = w - 24;
  const body = [
    `  <text x="24" y="38" font-size="11" ${M} fill="${t.bronze}" letter-spacing="1">${esc(p.meta.toUpperCase())}</text>`,
    pill(t, right, 22, p.status, "violet", dot),
    `  <text x="23" y="76" font-size="25" ${D} fill="${t.text}">${esc(p.title)}</text>`,
    ...p.lines.map((line, i) => `  <text x="24" y="${106 + i * 21}" font-size="13.5" fill="${t.secondary}">${esc(line)}</text>`),
    `  <line x1="24" y1="${h - 58}" x2="${right}" y2="${h - 58}" stroke="${t.border}" stroke-dasharray="2 4"/>`,
    chips(t, 24, h - 44, p.stack),
  ].join("\n");
  return frame(t, w, h, p.title, body);
}

// ---------------------------------------------------------------- galaxy

/** The year as a two-armed spiral galaxy: one star per day, a year ago at the
 *  core and today at the rim, size and colour by commits. It turns slowly. */
function galaxyCard(t) {
  const w = 860;
  const h = 410;
  const days = DATA.days;
  const N = days.length;
  const max = Math.max(1, ...days.map((d) => d.count));
  const cx = 600;
  const cy = 226;
  const css = `${TWINKLE}.gal{animation:spin 240s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.in{animation:in 1.4s cubic-bezier(.2,.7,.2,1) both}@keyframes in{from{opacity:0;transform:scale(.6)}}.ping{animation:ping 2.4s ease-out infinite}@keyframes ping{from{opacity:.9;transform:scale(.6)}to{opacity:0;transform:scale(2.6)}}`;

  const level = (c) => (c === 0 ? 0 : Math.min(4, 1 + Math.floor(Math.sqrt(c / max) * 4)));
  const dots = days.map((d, i) => {
    const f = Math.sqrt((i + 0.5) / N);
    const r = 16 + 214 * f;
    const a = 3.2 * 2 * Math.PI * f + (i % 2) * Math.PI;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    const lv = level(d.count);
    if (!d.count) return `<circle cx="${n1(x)}" cy="${n1(y)}" r="1.3" fill="${t.levels[1]}" fill-opacity=".55"/>`;
    const size = 1.8 + 3.4 * Math.sqrt(d.count / max);
    const halo = lv >= 3 ? `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(size * 2.4)}" fill="${t.levels[lv]}" fill-opacity=".18"/>` : "";
    return `${halo}<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(size)}" fill="${t.levels[lv]}"/>`;
  });
  const arms = [0, 1]
    .map((arm) => {
      const pts = [];
      for (let k = 0; k <= 160; k++) {
        const f = k / 160;
        const r = 16 + 214 * f;
        const a = 3.2 * 2 * Math.PI * f + arm * Math.PI;
        pts.push(`${n1(r * Math.cos(a))},${n1(r * Math.sin(a))}`);
      }
      return `<polyline points="${pts.join(" ")}" fill="none" stroke="${t.violet}" stroke-opacity=".22" stroke-width="7" stroke-linecap="round"/>`;
    })
    .join("");
  // Today sits at the rim; give it a ping.
  const lastF = Math.sqrt((N - 0.5) / N);
  const lastA = 3.2 * 2 * Math.PI * lastF + ((N - 1) % 2) * Math.PI;
  const lx = (16 + 214 * lastF) * Math.cos(lastA);
  const ly = (16 + 214 * lastF) * Math.sin(lastA);
  const today = `<circle class="ping" style="transform-origin:${n1(lx)}px ${n1(ly)}px" cx="${n1(lx)}" cy="${n1(ly)}" r="5" fill="none" stroke="${t.pink}" stroke-width="1.5"/>`;

  const defs = `    <radialGradient id="core"><stop offset="0" stop-color="${t.star}" stop-opacity=".9"/><stop offset=".22" stop-color="${t.bronze}" stop-opacity=".45"/><stop offset=".6" stop-color="${t.violet}" stop-opacity=".12"/><stop offset="1" stop-color="${t.violet}" stop-opacity="0"/></radialGradient>`;

  const busiest = DATA.months.reduce((a, b) => (b.count > a.count ? b : a));
  const facts = [
    ["Longest streak", `${DATA.streak.longest} days`],
    ["Best day", `${DATA.bestDay.count} · ${day(DATA.bestDay.date, false)}`],
    ["Busiest month", `${monthName(busiest.month, "short")} · ${busiest.count}`],
    ["Active days", `${DATA.activeDays}`],
  ];
  const rows = facts
    .map(([label, value], i) => {
      const y = 232 + i * 30;
      return `  <text x="24" y="${y}" font-size="13" fill="${t.secondary}">${esc(label)}</text>
  <text x="262" y="${y}" text-anchor="end" font-size="12.5" ${M} fill="${t.text}">${esc(value)}</text>
  <line x1="24" y1="${y + 11}" x2="262" y2="${y + 11}" stroke="${t.border}" stroke-dasharray="2 4"/>`;
    })
    .join("\n");
  const legend = t.levels
    .map((c, i) => `<circle cx="${n1(70 + i * 16)}" cy="${h - 34}" r="${i ? 2 + i * 0.8 : 1.4}" fill="${c}"/>`)
    .join("");
  const first = days[0].date;
  const rand = seeded(42);
  const body = `${heading(t, w, "A year in orbit", "commits per day · last 12 months")}
${stars(t, rand, 60, { x: 300, y: 60, w: 540, h: 330 }, { twinkle: 10 })}
  <text x="24" y="94" font-size="11" ${M} fill="${t.muted}" letter-spacing=".5">CURRENT STREAK</text>
  <text x="22" y="156" font-size="64" ${D} fill="${t.violet}">${DATA.streak.current}</text>
  <text x="${n1(26 + String(DATA.streak.current).length * 39)}" y="156" font-size="22" fill="${t.secondary}">${DATA.streak.current === 1 ? "day" : "days"}</text>
  <text x="24" y="184" font-size="13" fill="${t.muted}">${fmt(DATA.commits)} commits since ${esc(day(first))}</text>
${rows}
  <text x="24" y="${h - 30}" font-size="11" fill="${t.muted}">quiet</text>${legend}<text x="${70 + 5 * 16 + 2}" y="${h - 30}" font-size="11" fill="${t.muted}">busy</text>
  <g transform="translate(${cx} ${cy}) rotate(-14) scale(1 .56)">
    <g class="in">
      <circle r="120" fill="url(#core)"/>
      <g class="gal">${arms}${dots.join("")}${today}</g>
    </g>
  </g>
  <text x="${w - 24}" y="${h - 22}" text-anchor="end" font-size="11" ${M} fill="${t.muted}">core: ${esc(monthName(first.slice(0, 7), "short"))} ${first.slice(0, 4)} · rim: today</text>`;
  return frame(t, w, h, "A year in orbit", body, { css: css + REDUCED, defs });
}

// ---------------------------------------------------------------- grid + comet

/** The classic contribution grid, and a comet that flies down and up each
 *  week, eating every busy day it passes. They all come back for the next lap. */
function cometCard(t) {
  const w = 860;
  const h = 218;
  const days = DATA.days;
  const max = Math.max(1, ...days.map((d) => d.count));
  const startDow = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const pitch = 14;
  const cell = 11;
  const weeks = Math.ceil((days.length + startDow) / 7);
  const gx = Math.round((w - weeks * pitch) / 2) + 10;
  const gy = 78;
  const pos = (week, dow) => [gx + week * pitch, gy + dow * pitch];

  // The comet's path: down week 0, up week 1, down week 2, ...
  const path = [];
  for (let wk = 0; wk < weeks; wk++) {
    for (let k = 0; k < 7; k++) path.push([wk, wk % 2 ? 6 - k : k]);
  }
  const lap = 26; // seconds for the whole path
  const travel = 0.92; // share of the lap spent flying; the rest, everything regrows
  const at = (idx) => (idx / (path.length - 1)) * travel * 100;
  const frames = path
    .map(([wk, dow], idx) => {
      const [x, y] = pos(wk, dow);
      return `${n1(at(idx))}%{transform:translate(${x + cell / 2}px,${y + cell / 2}px)}`;
    })
    .join("");
  const [ex, ey] = pos(...path[path.length - 1]);
  let css = `@keyframes fly{${frames}100%{transform:translate(${ex + cell / 2}px,${ey + cell / 2}px)}}.comet{animation:fly ${lap}s linear infinite both}`;
  const order = new Map(path.map(([wk, dow], idx) => [`${wk}:${dow}`, idx]));

  const level = (c) => (c === 0 ? 0 : Math.min(4, 1 + Math.floor(Math.sqrt(c / max) * 4)));
  const cells = [];
  const eaten = [];
  days.forEach((d, i) => {
    const wk = Math.floor((i + startDow) / 7);
    const dow = (i + startDow) % 7;
    const [x, y] = pos(wk, dow);
    cells.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2.5" fill="${t.levels[0]}"/>`);
    if (!d.count) return;
    const when = at(order.get(`${wk}:${dow}`));
    const name = `e${i}`;
    css += `@keyframes ${name}{0%,${n1(when)}%{opacity:1}${n1(Math.min(when + 0.6, 97))}%,97%{opacity:0}100%{opacity:1}}.${name}{animation:${name} ${lap}s linear infinite}`;
    eaten.push(`<rect class="${name}" x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2.5" fill="${t.levels[level(d.count)]}"/>`);
  });

  // Month initials above the first week of each month.
  const months = [];
  let last = "";
  days.forEach((d, i) => {
    const m = d.date.slice(0, 7);
    const wk = Math.floor((i + startDow) / 7);
    if (m !== last && (i + startDow) % 7 === 0) {
      last = m;
      months.push(`<text x="${gx + wk * pitch}" y="${gy - 10}" font-size="10" ${M} fill="${t.muted}">${monthName(m, "short")}</text>`);
    }
  });

  const tail = [0.12, 0.24, 0.36, 0.48]
    .map((delay, i) => `<g class="comet" style="animation-delay:-${(lap - delay).toFixed(2)}s"><circle r="${3.6 - i * 0.7}" fill="${t.pink}" fill-opacity="${(0.55 - i * 0.12).toFixed(2)}"/></g>`)
    .join("");
  const [sx, sy] = pos(0, 0);
  const comet = `${tail}<g class="comet" transform="translate(${sx + cell / 2} ${sy + cell / 2})"><circle r="9" fill="${t.pink}" fill-opacity=".18"/><circle r="4.6" fill="${t.pink}"/><circle r="2" fill="${t.star}"/></g>`;

  const legend = t.levels
    .map((c, i) => `<rect x="${w - 120 + i * 15}" y="${h - 32}" width="11" height="11" rx="2.5" fill="${c}"/>`)
    .join("");
  const body = `${heading(t, w, "The comet", "eats every day I shipped, then lets it grow back")}
  ${months.join("")}
  <g>${cells.join("")}</g>
  <g>${eaten.join("")}</g>
  ${comet}
  <text x="24" y="${h - 22}" font-size="11.5" fill="${t.muted}">${fmt(DATA.commits)} commits on ${DATA.activeDays} days, GitHub.com and Wakandi's own GitHub</text>
  <text x="${w - 128}" y="${h - 22}" text-anchor="end" font-size="11" fill="${t.muted}">less</text>${legend}<text x="${w - 120 + 5 * 15 + 2}" y="${h - 22}" font-size="11" fill="${t.muted}">more</text>`;
  return frame(t, w, h, "The comet", body, { css: css + REDUCED });
}

// ---------------------------------------------------------------- small cards

function linesCard(t) {
  const w = 425;
  const h = 280;
  const L = DATA.lines;
  const months = DATA.months.slice(-12).map((m) => ({
    month: m.month,
    added: L.byMonth[m.month]?.added ?? 0,
    removed: L.byMonth[m.month]?.removed ?? 0,
  }));
  const max = Math.max(1, ...months.map((m) => Math.max(m.added, m.removed)));
  const base = 196;
  const up = 58;
  const step = (w - 48) / months.length;
  const css = `.u{transform-box:fill-box;transform-origin:50% 100%;animation:g .8s cubic-bezier(.2,.7,.2,1) both}.dn{transform-box:fill-box;transform-origin:50% 0;animation:g .8s cubic-bezier(.2,.7,.2,1) both}@keyframes g{from{transform:scaleY(0)}}`;
  const bars = months
    .map((m, i) => {
      const x = 24 + i * step + step * 0.22;
      const bw = step * 0.56;
      const a = m.added ? Math.max(2, (m.added / max) * up) : 0;
      const r = m.removed ? Math.max(2, (m.removed / max) * up) : 0;
      const delay = `style="animation-delay:${i * 40}ms"`;
      return [
        a && `  <rect class="u" ${delay} x="${n1(x)}" y="${n1(base - a)}" width="${n1(bw)}" height="${n1(a)}" rx="2" fill="${t.violet}"/>`,
        r && `  <rect class="dn" ${delay} x="${n1(x)}" y="${base + 1}" width="${n1(bw)}" height="${n1(r)}" rx="2" fill="${t.bronze}" fill-opacity=".6"/>`,
        `  <text x="${n1(x + bw / 2)}" y="${h - 18}" text-anchor="middle" font-size="10" ${M} fill="${t.muted}">${monthName(m.month, "narrow")}</text>`,
      ].filter(Boolean).join("\n");
    })
    .join("\n");
  const added = `+${kilo(L.added)}`;
  const body = `${heading(t, w, "Lines changed", "last 12 months")}
  <text x="22" y="100" font-size="44" ${D} fill="${t.violet}">${added}</text>
  <text x="${n1(34 + added.length * 28)}" y="100" font-size="24" ${D} fill="${t.bronze}">−${kilo(L.removed)}</text>
  <text x="24" y="122" font-size="11.5" fill="${t.muted}">${L.bulkSkipped ? `Leaving out ${L.bulkSkipped} bulk commits: imports and generated files` : "Added and removed"}</text>
${bars}
  <line x1="24" y1="${base + 0.5}" x2="${w - 24}" y2="${base + 0.5}" stroke="${t.border}"/>`;
  return frame(t, w, h, "Lines changed", body, { css: css + REDUCED });
}

function sourceCard(t) {
  const w = 425;
  const h = 280;
  const { team, personal } = DATA.bySource;
  const total = team + personal || 1;
  const cx = 104;
  const cy = 162;
  const r = 62;
  const C = 2 * Math.PI * r;
  const teamLen = (team / total) * C;
  const css = `.arc{animation:draw 1.4s cubic-bezier(.2,.7,.2,1) both}@keyframes draw{from{stroke-dashoffset:${n1(C)}}}`;
  const row = (y, tone, label, count, line1, line2) => `  <rect x="204" y="${y - 10}" width="10" height="10" rx="3" fill="${t[tone]}"/>
  <text x="222" y="${y}" font-size="14" ${D} fill="${t.text}">${esc(label)}</text>
  <text x="${w - 24}" y="${y}" text-anchor="end" font-size="12.5" ${M} fill="${t[tone]}">${count}</text>
  <text x="222" y="${y + 19}" font-size="11.5" fill="${t.muted}">${esc(line1)}</text>
  <text x="222" y="${y + 34}" font-size="11.5" fill="${t.muted}">${esc(line2)}</text>`;
  const body = `${heading(t, w, "Where my commits go", "last 12 months")}
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${t.track}" stroke-width="18"/>
  <circle class="arc" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${t.bronze}" stroke-width="18" stroke-dasharray="${n1(C)} ${n1(C)}" transform="rotate(-90 ${cx} ${cy})"/>
  <circle class="arc" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${t.violet}" stroke-width="18" stroke-dasharray="${n1(teamLen)} ${n1(C)}" transform="rotate(-90 ${cx} ${cy})"/>
  <text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="30" ${D} fill="${t.text}">${fmt(total)}</text>
  <text x="${cx}" y="${cy + 26}" text-anchor="middle" font-size="11" ${M} fill="${t.muted}">commits</text>
${row(118, "violet", "Wakandi", team, "Jamii Connect, CRB Lookup,", "Jamii Studio, Waypoint")}
${row(196, "bronze", "Personal & client", personal, "MemberPulse, Expert RN Scholars,", "Sheria AI, EA Outreach")}`;
  return frame(t, w, h, "Where my commits go", body, { css: css + REDUCED });
}

function languagesCard(t) {
  const w = 425;
  const h = 280;
  const langs = DATA.languages.filter((l) => l.pct >= 0.5).slice(0, 6);
  const tones = [t.violet, t.bronze, t.lavender, t.cyan, t.mocha, t.muted];
  const total = langs.reduce((s, l) => s + l.pct, 0);
  let bx = 24;
  const barW = w - 48;
  const bar = langs
    .map((l, i) => {
      const lw = (l.pct / total) * barW;
      const out = `<rect x="${n1(bx)}" y="64" width="${n1(Math.max(lw - 2, 1))}" height="12" rx="4" fill="${tones[i]}"/>`;
      bx += lw;
      return out;
    })
    .join("");
  const rows = langs
    .map((l, i) => {
      const col = i % 2;
      const y = 120 + Math.floor(i / 2) * 38;
      const x = 24 + col * 196;
      return `  <circle cx="${x + 5}" cy="${y - 4}" r="5" fill="${tones[i]}"/>
  <text x="${x + 18}" y="${y}" font-size="13.5" fill="${t.text}">${esc(l.name)}</text>
  <text x="${x + 178}" y="${y}" text-anchor="end" font-size="12" ${M} fill="${t.secondary}">${l.pct.toFixed(1)}%</text>`;
    })
    .join("\n");
  const recent = DATA.recentLanguages.slice(0, 2).map((l) => `${l.name} ${Math.round(l.pct)}%`).join(" · ");
  const body = `${heading(t, w, "Languages I write", "weighted by my commits")}
  ${bar}
${rows}
  <line x1="24" y1="${h - 46}" x2="${w - 24}" y2="${h - 46}" stroke="${t.border}"/>
  <text x="24" y="${h - 22}" font-size="11.5" fill="${t.muted}">Last 60 days</text>
  <text x="${w - 24}" y="${h - 22}" text-anchor="end" font-size="11.5" ${M} fill="${t.lavender}">${esc(recent)}</text>`;
  return frame(t, w, h, "Languages I write", body);
}

function weekdaysCard(t) {
  const w = 425;
  const h = 280;
  const list = DATA.weekdays;
  const max = Math.max(1, ...list.map(([, n]) => n));
  const base = 232;
  const chartH = 136;
  const step = (w - 48) / list.length;
  const css = `.u{transform-box:fill-box;transform-origin:50% 100%;animation:g .8s cubic-bezier(.2,.7,.2,1) both}@keyframes g{from{transform:scaleY(0)}}`;
  const defs = `    <linearGradient id="bar" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${t.violet}"/><stop offset="1" stop-color="${t.lavender}"/></linearGradient>`;
  const bars = list
    .map(([name, n], i) => {
      const x = 24 + i * step + step * 0.24;
      const bw = step * 0.52;
      const bh = Math.max(2, (n / max) * chartH);
      const lead = n === max;
      return `  <rect class="u" style="animation-delay:${i * 60}ms" x="${n1(x)}" y="${n1(base - bh)}" width="${n1(bw)}" height="${n1(bh)}" rx="4" fill="${lead ? "url(#bar)" : t.violet}" fill-opacity="${lead ? 1 : 0.4}"/>
  <text x="${n1(x + bw / 2)}" y="${n1(base - bh - 7)}" text-anchor="middle" font-size="11" ${M} fill="${lead ? t.lavender : t.secondary}">${n}</text>
  <text x="${n1(x + bw / 2)}" y="${base + 20}" text-anchor="middle" font-size="11.5" fill="${t.muted}">${name}</text>`;
    })
    .join("\n");
  const body = `${heading(t, w, "When I ship", "commits by weekday")}
  <line x1="24" y1="${base - chartH / 2}" x2="${w - 24}" y2="${base - chartH / 2}" stroke="${t.track}"/>
  <line x1="24" y1="${base}" x2="${w - 24}" y2="${base}" stroke="${t.border}"/>
${bars}`;
  return frame(t, w, h, "When I ship", body, { css: css + REDUCED, defs });
}

// ---------------------------------------------------------------- certifications

function certsCard(t) {
  const w = 860;
  const cols = 3;
  const rowH = 66;
  const top = 64;
  const h = top + Math.ceil(CERTS.length / cols) * rowH + 10;
  const col = (w - 48) / cols;
  const css = `.p{animation:up .6s cubic-bezier(.2,.7,.2,1) both}@keyframes up{from{opacity:0;transform:translateY(6px)}}`;
  const cells = CERTS.map(([issuer, title, detail, tone], i) => {
    const x = 24 + (i % cols) * col;
    const y = top + Math.floor(i / cols) * rowH;
    return `  <g class="p" style="animation-delay:${i * 50}ms">
  <circle cx="${x + 15}" cy="${y + 27}" r="14" fill="${t[tone]}" fill-opacity=".14" stroke="${t[tone]}" stroke-opacity=".6"/>
  <path d="M${x + 9} ${y + 27.5}l4 4 7.6-8.2" fill="none" stroke="${t[tone]}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="${x + 40}" y="${y + 13}" font-size="10.5" ${M} fill="${t.bronze}" letter-spacing=".5">${esc(issuer.toUpperCase())}</text>
  <text x="${x + 40}" y="${y + 33}" font-size="15" ${D} fill="${t.text}">${esc(title)}</text>
  <text x="${x + 40}" y="${y + 50}" font-size="11.5" fill="${t.muted}">${esc(detail)}</text>
  </g>`;
  }).join("\n");
  const body = `${heading(t, w, "Always learning", `${CERTS.length} certificates`)}\n${cells}`;
  return frame(t, w, h, "Always learning", body, { css: css + REDUCED });
}

// ---------------------------------------------------------------- journey

/** Education and work as stops along a line; the last stop pulses. */
function journeyCard(t) {
  const w = 860;
  const h = 196;
  const x0 = 112;
  const x1 = w - 112;
  const y = 104;
  const step = (x1 - x0) / (JOURNEY.length - 1);
  const css = `.ping{animation:ping 2.4s ease-out infinite}@keyframes ping{from{opacity:.9;transform:scale(.6)}to{opacity:0;transform:scale(2.4)}}.p{animation:up .6s cubic-bezier(.2,.7,.2,1) both}@keyframes up{from{opacity:0;transform:translateY(6px)}}`;
  const stops = JOURNEY.map(([when, title, sub], i) => {
    const x = x0 + i * step;
    const last = i === JOURNEY.length - 1;
    const tone = last ? t.pink : t.violet;
    const ping = last
      ? `<circle class="ping" style="transform-origin:${n1(x)}px ${y}px" cx="${n1(x)}" cy="${y}" r="9" fill="none" stroke="${t.pink}" stroke-width="1.5"/>`
      : "";
    return `  <g class="p" style="animation-delay:${i * 90}ms">
  ${ping}<circle cx="${n1(x)}" cy="${y}" r="${last ? 7 : 5.5}" fill="${last ? t.pink : t.surface}" stroke="${tone}" stroke-width="2.5"/>
  <text x="${n1(x)}" y="${y - 22}" text-anchor="middle" font-size="11.5" ${M} fill="${last ? t.pink : t.bronze}">${esc(when.toUpperCase())}</text>
  <text x="${n1(x)}" y="${y + 32}" text-anchor="middle" font-size="14" ${D} fill="${t.text}">${esc(title)}</text>
  <text x="${n1(x)}" y="${y + 51}" text-anchor="middle" font-size="11.5" fill="${t.muted}">${esc(sub)}</text>
  </g>`;
  }).join("\n");
  const body = `${heading(t, w, "Journey", "education and work")}
  <line x1="${x0 - 56}" y1="${y}" x2="${x1 + 56}" y2="${y}" stroke="${t.violet}" stroke-opacity=".6" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round"/>
  <rect x="${x0}" y="${y - 1.25}" width="${x1 - x0}" height="2.5" rx="1.25" fill="url(#edge)"/>
${stops}`;
  return frame(t, w, h, "Journey", body, { css: css + REDUCED });
}

// ---------------------------------------------------------------- favourites

function favouritesCard(t) {
  const w = 860;
  const pw = 100;
  const ph = 150;
  const rowH = ph + 52;
  const top = 64;
  const h = top + SHOWS.length * rowH + 4;
  const left = 196;
  const col = (w - left - 24) / 5;
  const css = `.p{animation:up .7s cubic-bezier(.2,.7,.2,1) both}@keyframes up{from{opacity:0;transform:translateY(8px)}}`;
  const clips = [];
  let k = 0;
  const rows = SHOWS.map((show, r) => {
    const y = top + r * rowH;
    const tone = t[show.tone];
    const label = `  <rect x="24" y="${y + 4}" width="4" height="40" rx="2" fill="${tone}"/>
  <text x="38" y="${y + 22}" font-size="19" ${D} fill="${t.text}">${esc(show.title)}</text>
  <text x="38" y="${y + 41}" font-size="11.5" fill="${t.muted}">${esc(show.sub)}</text>`;
    const cast = show.cast
      .map(([file, name], i) => {
        const cx = left + i * col + col / 2;
        const x = cx - pw / 2;
        const id = `c${k}`;
        const delay = k++ * 50;
        const data = readFileSync(`assets/characters/${file}`).toString("base64");
        clips.push(`<clipPath id="${id}"><rect x="${n1(x)}" y="${y}" width="${pw}" height="${ph}" rx="12"/></clipPath>`);
        return `  <g class="p" style="animation-delay:${delay}ms">
    <image href="data:image/jpeg;base64,${data}" x="${n1(x)}" y="${y}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>
    <rect x="${n1(x + 0.75)}" y="${y + 0.75}" width="${pw - 1.5}" height="${ph - 1.5}" rx="11.5" fill="none" stroke="${t.bronze}" stroke-opacity=".6" stroke-width="1.5"/>
    <text x="${n1(cx)}" y="${y + ph + 22}" text-anchor="middle" font-size="13.5" ${D} fill="${t.text}">${esc(name)}</text>
  </g>`;
      })
      .join("\n");
    return `${label}\n${cast}`;
  }).join("\n");
  const body = `${heading(t, w, "Favourite worlds", "animation I keep rewatching")}
  <defs>${clips.join("")}</defs>
${rows}`;
  return frame(t, w, h, "Favourite worlds", body, { css: css + REDUCED });
}

// ---------------------------------------------------------------- contact

function contactCard(t) {
  const w = 860;
  const h = 150;
  const rand = seeded(3);
  const body = `${stars(t, rand, 40, { x: 520, y: 14, w: 320, h: 122 }, { twinkle: 8 })}
  <text x="30" y="64" font-size="32" ${D} fill="${t.text}">${esc(CONTACT.title)}</text>
${CONTACT.lines.map((l, i) => `  <text x="32" y="${96 + i * 21}" font-size="14.5" fill="${t.secondary}">${esc(l)}</text>`).join("\n")}`;
  return frame(t, w, h, CONTACT.title, body, { css: TWINKLE + REDUCED });
}

/** A button-sized card, one per link, since a README image can hold one link. */
function buttonCard(t, label, sub, tone, icon) {
  const w = 425;
  const h = 76;
  const body = `  <circle cx="44" cy="38" r="20" fill="${t[tone]}" fill-opacity=".14" stroke="${t[tone]}" stroke-opacity=".6"/>
  <g transform="translate(32 26)" fill="${t[tone]}">${icon(t[tone])}</g>
  <text x="78" y="35" font-size="16" ${D} fill="${t.text}">${esc(label)}</text>
  <text x="78" y="54" font-size="12" ${M} fill="${t.muted}">${esc(sub)}</text>
  <text x="${w - 28}" y="44" text-anchor="end" font-size="20" ${D} fill="${t[tone]}">→</text>`;
  return frame(t, w, h, label, body);
}
// 24×24 marks, drawn simply.
const ICON_LINKEDIN = () => `<rect x="0" y="0" width="24" height="24" rx="4" fill="none"/><rect x="3" y="9" width="4" height="12" rx="1"/><circle cx="5" cy="4.6" r="2.3"/><path d="M10 9h3.8v1.8c.6-1.1 2-2.1 4-2.1 3.3 0 4.2 2 4.2 5v7.3h-4v-6.4c0-1.5-.3-2.6-1.8-2.6s-2.2 1.1-2.2 2.7v6.3h-4z"/>`;
const ICON_EMAIL = (c) => `<rect x="1.5" y="4.5" width="21" height="15" rx="3" fill="none" stroke="${c}" stroke-width="2"/><path d="M3 6.5l9 6.5 9-6.5" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

// ---------------------------------------------------------------- build

const cards = [];
for (const [theme, t] of Object.entries(THEMES)) {
  const add = (name, svg) => cards.push({ path: `assets/cards/${name}-${theme}.svg`, svg });
  add("header", headerCard(t));
  add("stats", statsCard(t));
  for (const p of PROJECTS) add(p.file, projectCard(t, p));
  add("galaxy", galaxyCard(t));
  add("comet", cometCard(t));
  add("lines", linesCard(t));
  add("sources", sourceCard(t));
  add("languages", languagesCard(t));
  add("weekdays", weekdaysCard(t));
  add("certs", certsCard(t));
  add("journey", journeyCard(t));
  add("favourites", favouritesCard(t));
  add("contact", contactCard(t));
  add("linkedin", buttonCard(t, "Connect on LinkedIn", "linkedin.com/in/motachikelvin", "violet", ICON_LINKEDIN));
  add("email", buttonCard(t, "Email me", EMAIL, "violet", ICON_EMAIL));
}

// Cut each font down to the characters the cards draw.
const decode = (s) => s.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&amp;", "&");
const used = new Set();
for (const { svg } of cards) {
  const visible = svg.replace(/<style>[\s\S]*?<\/style>/g, "");
  for (const m of visible.matchAll(/>([^<]+)</g)) for (const ch of decode(m[1])) used.add(ch);
}
const chars = [...used].join("") + "0123456789+−·%";
const faces = [];
for (const f of Object.values(FONTS)) {
  const subset = await subsetFont(readFileSync(f.file), chars, { targetFormat: "woff2" });
  faces.push(`@font-face{font-family:${f.family};font-weight:${f.weight};src:url(data:font/woff2;base64,${subset.toString("base64")}) format("woff2")}`);
}
const fontCss = faces.join("");

mkdirSync("assets/cards", { recursive: true });
let bytes = 0;
for (const { path, svg } of cards) {
  const out = svg.replace("/*FONTS*/", fontCss);
  bytes += out.length;
  writeFileSync(path, out);
}

// ---------------------------------------------------------------- README

// Refresh everything between <!-- live:NAME --> and <!-- /live:NAME -->, so
// the alt text always says what the cards say.
const picture = (name, alt, width) => `  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/cards/${name}-dark.svg">
    <img src="assets/cards/${name}-light.svg" alt="${esc(alt)}" width="${width}">
  </picture>`;
const busiest = DATA.months.reduce((a, b) => (b.count > a.count ? b : a));
const activeMonths = DATA.months.filter((m) => m.count).map((m) => `${monthName(m.month, "short")} ${m.count}`).join(", ");
const LIVE = {
  stats: `<p>
${picture("stats", `${fmt(DATA.commits)} commits in the last 12 months, private work included; ${DATA.pullRequestsMerged} of ${DATA.pullRequests} pull requests merged; current streak ${DATA.streak.current} days (longest ${DATA.streak.longest}); ${fmt(DATA.lines.added)} lines added and ${fmt(DATA.lines.removed)} removed; ${DATA.activeDays} active days in ${DATA.reposThisYear} repos. Updated ${day(DATA.updated)}.`, "100%")}
</p>`,
  year: `<p>
${picture("galaxy", `A year of commits drawn as a spiral galaxy, one star per day. By month: ${activeMonths}. Busiest month ${monthName(busiest.month)} with ${busiest.count}; best day ${DATA.bestDay.count} commits on ${day(DATA.bestDay.date)}; current streak ${DATA.streak.current} days, longest ${DATA.streak.longest}.`, "100%")}
</p>
<p>
${picture("comet", `The contribution grid for the last 12 months, with a comet that flies through it eating the ${DATA.activeDays} days I committed.`, "100%")}
</p>
<p>
${picture("sources", `Where my commits go: ${DATA.bySource.team} to Wakandi (Jamii Connect, CRB Lookup, Jamii Studio, Waypoint) and ${DATA.bySource.personal} to personal and client projects.`, "49%")}
${picture("lines", `Lines changed in the last 12 months: ${fmt(DATA.lines.added)} added and ${fmt(DATA.lines.removed)} removed, leaving out ${DATA.lines.bulkSkipped} bulk commits.`, "49%")}
</p>
<p>
${picture("languages", `Languages, weighted by my commits: ${DATA.languages.filter((l) => l.pct >= 0.5).slice(0, 6).map((l) => `${l.name} ${l.pct}%`).join(", ")}.`, "49%")}
${picture("weekdays", `Commits by weekday: ${DATA.weekdays.map(([d, n]) => `${d} ${n}`).join(", ")}.`, "49%")}
</p>`,
};
let readme = readFileSync("README.md", "utf8");
for (const [name, html] of Object.entries(LIVE)) {
  const re = new RegExp(`(<!-- live:${name} -->)[\\s\\S]*?(<!-- /live:${name} -->)`);
  if (re.test(readme)) readme = readme.replace(re, `$1\n${html}\n$2`);
}
writeFileSync("README.md", readme);

console.log(`Built ${cards.length} cards (${Math.round(bytes / cards.length / 1024)} KB each on average)`);
