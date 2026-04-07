#!/usr/bin/env node
/**
 * Hoos' List + Undergraduate Record course harvester.
 *
 * 1. Listings: https://hooslist.virginia.edu/{term}/Group/{GroupKey}
 * 2. Verification: ClassHistory returns 200 and mentions the catalog number
 * 3. Descriptions: https://records.ureg.virginia.edu/ (preview_course_nopop)
 *
 * Usage (from repo root):
 *   npm run harvest:hooslist -- --term 1268 --groups English --max 5 --out ./data/hooslist-out
 *   node scripts/hooslist-course-harvest.mjs --term 1268 --groups English --max 5 --out ./data/hooslist-out
 *
 * Undergrad Record catoid defaults to 67 (2025–26). For graduate-only listings try --grad-catalog 68
 * after the undergrad search returns no match.
 *
 * Outputs: {out}/courses.json, {out}/import.sql, {out}/courses.csv
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const HOOS_ORIGIN = "https://hooslist.virginia.edu";
const RECORDS_SEARCH = "https://records.ureg.virginia.edu/search_advanced.php";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseArgs() {
  const a = process.argv.slice(2);
  const o = {
    term: null,
    groups: [],
    catalog: "67",
    gradCatalog: "",
    groupsFile: "",
    out: "./data/hooslist-out",
    delay: 400,
    max: Infinity,
    dry: false,
  };
  for (let i = 0; i < a.length; i++) {
    const k = a[i];
    if (k === "--term") o.term = a[++i];
    else if (k === "--groups") o.groups = a[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (k === "--catalog") o.catalog = a[++i];
    else if (k === "--grad-catalog") o.gradCatalog = a[++i];
    else if (k === "--out") o.out = a[++i];
    else if (k === "--delay") o.delay = Number(a[++i]) || 400;
    else if (k === "--max") o.max = Number(a[++i]) || Infinity;
    else if (k === "--dry") o.dry = true;
    else if (k === "--groups-file") o.groupsFile = a[++i];
    else if (k === "-h" || k === "--help") o.help = true;
  }
  return o;
}

async function fetchText(url, label) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "UVA-CourseHarvest/1.0 (+local script; academic data)",
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status} for ${url}`);
  return await res.text();
}

/** @returns {{ subject: string, catalogNumber: string, title: string, credits: number | null }[]} */
function parseHooslistGroupHtml(html) {
  const courses = [];
  const linkRe =
    /href="\/ClassSchedule\/ClassHistory\?subject=([A-Z0-9]+)&(?:amp;)?catalogNumber=(\d+)"/gi;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const subject = m[1];
    const catalogNumber = m[2];
    const start = m.index;
    const slice = html.slice(start, start + 8000);
    const titleMatch = slice.match(
      /course-name-col[^>]*>[\s\S]*?<div class="h6 mb-0">([^<]+)<\/div>/,
    );
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : "";
    const credMatch = slice.match(/data-credits="(\d+)\s*Units"/);
    const credits = credMatch ? Number(credMatch[1]) : null;
    const code = `${subject} ${catalogNumber}`;
    const prev = courses.find((c) => c.code === code);
    if (!prev) {
      courses.push({ subject, catalogNumber, code, title, credits });
    } else if (!prev.title && title) {
      prev.title = title;
    } else if (prev.credits == null && credits != null) {
      prev.credits = credits;
    }
  }
  return courses;
}

function decodeHtmlEntities(s) {
  return s
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function verifyClassHistory(subject, catalogNumber, delay) {
  const q = new URLSearchParams({ subject, catalogNumber });
  const url = `${HOOS_ORIGIN}/ClassSchedule/ClassHistory?${q}`;
  await sleep(delay);
  const html = await fetchText(url, "ClassHistory");
  const ok =
    html.includes(`catalogNumber=${catalogNumber}`) ||
    html.includes(`catalogNumber=${catalogNumber}"`) ||
    html.includes(`data-catalog="${catalogNumber}"`) ||
    new RegExp(
      `Course history for\\s+${subject}\\s*-\\s*${catalogNumber}\\b`,
      "i",
    ).test(html);
  const sisMatch = html.match(/id="sd-sisdesc"[^>]*>([^<]*)</);
  const sisLine = sisMatch ? decodeHtmlEntities(sisMatch[1].trim()) : "";
  const sisDescription = sisLine && sisLine !== "—" ? sisLine : "";
  return { verified: ok, classHistoryUrl: url, sisDescription };
}

/**
 * Find first "Best Match" course link after catalog search.
 */
async function searchRecordCoid(subject, catalogNumber, catoid, delay) {
  const keyword = `${subject} ${catalogNumber}`;
  const params = new URLSearchParams({
    cur_catoid: String(catoid),
    search_database: "Search",
    cpage: "1",
    "filter[keyword]": keyword,
    "filter[3]": "1",
  });
  const url = `${RECORDS_SEARCH}?${params}`;
  await sleep(delay);
  const html = await fetchText(url, "RecordSearch");
  const idx = html.indexOf("Best Match");
  if (idx === -1) return { coid: null, searchUrl: url };
  const slice = html.slice(idx, idx + 2500);
  const m = slice.match(/preview_course_nopop\.php\?catoid=(\d+)&coid=(\d+)/);
  if (!m) return { coid: null, searchUrl: url };
  return { catoid: m[1], coid: m[2], searchUrl: url };
}

async function fetchRecordDescription(catoid, coid, delay) {
  const url = `https://records.ureg.virginia.edu/preview_course_nopop.php?catoid=${catoid}&coid=${coid}`;
  await sleep(delay);
  const html = await fetchText(url, "RecordPreview");
  const titleMatch = html.match(/id='course_preview_title'>([^<]+)</);
  const recordTitle = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : "";
  const blockMatch = html.match(
    /id='course_preview_title'>[^<]+<\/h1><hr>([\s\S]*?)<br><br>Credits:/,
  );
  let body = "";
  if (blockMatch) {
    body = blockMatch[1]
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\n{2,}/g, "\n");
    body = decodeHtmlEntities(body).replace(/\s+/g, " ").trim();
    body = body.replace(/^Effective Date\s+[\d/]+\s*/i, "").trim();
  }
  return { recordTitle, description: body, recordUrl: url };
}

function sqlEscape(str) {
  if (str == null) return "";
  return String(str).replace(/'/g, "''");
}

/** PostgreSQL text[] literal for courses.majors / courses.tags */
function pgTextArray(arr) {
  if (!arr || arr.length === 0) return "'{}'::text[]";
  const esc = (s) => sqlEscape(s);
  return `ARRAY[${arr.map((s) => `'${esc(s)}'`).join(",")}]::text[]`;
}

function buildSqlRow(row) {
  const code = sqlEscape(row.code);
  const title = sqlEscape(row.title || "TBD");
  const prof = sqlEscape(row.professor || "TBD");
  const desc = sqlEscape(row.description || "");
  const majors = pgTextArray(row.majors || []);
  const tags = pgTextArray(row.tags || []);
  const cat = sqlEscape(row.category || "non_engineering");
  const credits =
    row.credits != null && Number.isFinite(Number(row.credits))
      ? Number(row.credits)
      : 3;
  return `  ('${code}', '${title}', ${credits}, '${prof}', '${desc}', ${majors}, ${tags}, '${cat}')`;
}

function mainHelp() {
  console.log(`Usage:
  node scripts/hooslist-course-harvest.mjs --term <termId> --groups English,History [--groups-file path] [--catalog 67] [--grad-catalog 68] [--out dir] [--delay ms] [--max n] [--dry]

Example:
  npm run harvest:hooslist -- --term 1268 --groups-file scripts/hooslist-non-engineering-groups.txt --out ./data/hooslist-out

Term id appears in Hoos' List URLs (e.g. .../1268/Group/English). Update when the site switches terms.
`);
}

async function loadGroupsFile(path) {
  const text = await readFile(resolve(path), "utf8");
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*$/, "").trim())
    .filter(Boolean);
}

async function main() {
  const opts = parseArgs();
  let groups = opts.groups;
  if (opts.groupsFile) {
    const fromFile = await loadGroupsFile(opts.groupsFile);
    groups = [...groups, ...fromFile];
  }
  if (opts.help || !opts.term || groups.length === 0) {
    mainHelp();
    process.exit(opts.help ? 0 : 1);
  }

  const outDir = resolve(opts.out);
  await mkdir(outDir, { recursive: true });

  /** @type {any[]} */
  const raw = [];

  for (const group of groups) {
    const groupUrl = `${HOOS_ORIGIN}/${opts.term}/Group/${encodeURIComponent(group)}`;
    console.error(`Fetching group: ${groupUrl}`);
    const html = await fetchText(groupUrl, `Group:${group}`);
    const parsed = parseHooslistGroupHtml(html);
    console.error(`  ${group}: ${parsed.length} courses in HTML`);
    for (const c of parsed) {
      raw.push({ ...c, group });
    }
    await sleep(opts.delay);
  }

  const byCode = new Map();
  for (const c of raw) {
    if (!byCode.has(c.code)) {
      byCode.set(c.code, c);
    }
  }
  const all = [...byCode.values()];
  const limited = all.slice(0, opts.max);
  console.error(`Unique courses across groups: ${all.length} (processing up to ${limited.length})`);
  console.error(`Processing ${limited.length} courses (verify + descriptions)...`);

  const results = [];
  for (const c of limited) {
    if (opts.dry) {
      results.push({ ...c, verified: null, description: "", sources: {} });
      continue;
    }
    const v = await verifyClassHistory(c.subject, c.catalogNumber, opts.delay);
    if (!v.verified) {
      console.error(`SKIP (not verified): ${c.code}`);
      continue;
    }
    let description = v.sisDescription;
    let recordUrl = "";
    let rec = await searchRecordCoid(c.subject, c.catalogNumber, opts.catalog, opts.delay);
    if (!rec.coid && opts.gradCatalog) {
      rec = await searchRecordCoid(c.subject, c.catalogNumber, opts.gradCatalog, opts.delay);
    }
    let displayTitle = c.title || "TBD";
    if (rec.coid) {
      const prev = await fetchRecordDescription(rec.catoid, rec.coid, opts.delay);
      recordUrl = prev.recordUrl;
      if (prev.description) {
        description = prev.description;
      } else if (prev.recordTitle && !description) {
        description = prev.recordTitle;
      }
      if (prev.recordTitle) {
        const dash = prev.recordTitle.split(/\s*-\s*/);
        if (dash.length >= 2) {
          displayTitle = dash.slice(1).join(" - ").trim();
        }
      }
    }
    if (!description && c.title) {
      const cred = c.credits != null ? ` (${c.credits} credits)` : "";
      description =
        `${c.title}${cred}. (Catalog narrative not found via Undergraduate Record search; verify manually if needed.)`;
    }

    results.push({
      code: c.code,
      subject: c.subject,
      catalogNumber: c.catalogNumber,
      title: displayTitle,
      credits: c.credits,
      professor: "TBD",
      description,
      majors: [],
      tags: [c.group].filter(Boolean),
      category: "non_engineering",
      sources: {
        hooslistGroup: `${HOOS_ORIGIN}/${opts.term}/Group/${c.group}`,
        classHistory: v.classHistoryUrl,
        recordSearch: rec.searchUrl,
        recordCourse: recordUrl || undefined,
      },
    });
    console.error(`OK ${c.code} — ${(description || "").slice(0, 72)}...`);
  }

  await writeFile(
    `${outDir}/courses.json`,
    JSON.stringify(results, null, 2),
    "utf8",
  );

  const csvHeader = "code,title,credits,professor,description,category,group\n";
  const csvBody = results
    .map((r) =>
      [
        csvQuote(r.code),
        csvQuote(r.title),
        r.credits ?? "",
        csvQuote(r.professor),
        csvQuote(r.description),
        csvQuote(r.category),
        csvQuote((r.tags && r.tags[0]) || ""),
      ].join(","),
    )
    .join("\n");
  await writeFile(`${outDir}/courses.csv`, csvHeader + csvBody, "utf8");

  const values = results.map(buildSqlRow).join(",\n");
  const sql = `-- Generated by scripts/hooslist-course-harvest.mjs
-- Upsert: enrich existing rows (e.g. engineering imports) without duplicating codes.
INSERT INTO courses (code, title, credits, professor, description, majors, tags, category)
VALUES
${values}
ON CONFLICT (code) DO UPDATE SET
  description = COALESCE(NULLIF(EXCLUDED.description, ''), courses.description),
  title = CASE WHEN EXCLUDED.title IS NOT NULL AND EXCLUDED.title <> 'TBD' THEN EXCLUDED.title ELSE courses.title END,
  credits = COALESCE(EXCLUDED.credits, courses.credits);
`;
  await writeFile(`${outDir}/import.sql`, sql, "utf8");

  console.error(`Wrote ${outDir}/courses.json, courses.csv, import.sql (${results.length} rows)`);
}

function csvQuote(s) {
  const t = String(s ?? "").replace(/"/g, '""');
  return `"${t}"`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
