/**
 * Backfill public.courses.elective_fulfillments and merge UVA degree elective labels into courses.tags
 * (service role required). Re-run after catalog imports.
 *   npm run recompute:electives
 */

import { readFile, access } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeElectiveFulfillmentTags,
  courseTagsForElectiveFulfillments,
  DEGREE_ELECTIVE_TAG_PREFIX
} from "../src/lib/elective-fulfillment-tags.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadDotEnvLocal() {
  const envPath = join(__dirname, "..", ".env.local");
  try { await access(envPath); } catch { return; }
  const raw = await readFile(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("\x27") && v.endsWith("\x27"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

async function main() {
  await loadDotEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const sb = createClient(url, serviceKey);
  const pageSize = 1000;
  type RowUp = { code: string; elective_fulfillments: string[]; tags: string[] };
  const rows: RowUp[] = [];
  for (let start = 0; ; start += pageSize) {
    const end = start + pageSize - 1;
    const { data, error } = await sb
      .from("courses")
      .select("code, tags")
      .order("code", { ascending: true })
      .range(start, end);
    if (error) { console.error(error); process.exit(1); }
    if (!data?.length) break;
    for (const row of data as { code: string; tags: string[] | null }[]) {
      const fulfillments = computeElectiveFulfillmentTags(row.code);
      const degreeTags = courseTagsForElectiveFulfillments(fulfillments);
      const baseTags = (row.tags ?? []).filter((t) => !t.startsWith(DEGREE_ELECTIVE_TAG_PREFIX));
      const tags = [...baseTags, ...degreeTags];
      rows.push({
        code: row.code,
        elective_fulfillments: fulfillments,
        tags
      });
    }
    if (data.length < pageSize) break;
  }
  const batch = 50;
  for (let i = 0; i < rows.length; i += batch) {
    const slice = rows.slice(i, i + batch);
    const res = await Promise.all(
      slice.map((row) =>
        sb
          .from("courses")
          .update({ elective_fulfillments: row.elective_fulfillments, tags: row.tags })
          .eq("code", row.code)
      )
    );
    const bad = res.find((r) => r.error);
    if (bad?.error) { console.error(bad.error); process.exit(1); }
    console.error("updated " + Math.min(i + batch, rows.length) + " / " + rows.length);
  }
  console.error("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });