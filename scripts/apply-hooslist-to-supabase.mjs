#!/usr/bin/env node
/**
 * Upsert data/hooslist-out/courses.json into Supabase public.courses.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (Settings → API → service_role).
 * RLS allows anon SELECT only, so the service role is required for writes.
 *
 *   node scripts/apply-hooslist-to-supabase.mjs
 *   npm run import:hooslist
 */

import { readFile, access } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadDotEnvLocal() {
  const p = join(__dirname, "..", ".env.local");
  try {
    await access(p);
  } catch {
    return;
  }
  const raw = await readFile(p, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

async function main() {
  await loadDotEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(`Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.
Add your service_role key to .env.local (never commit it), from:
  Supabase Dashboard → Project Settings → API → service_role secret
Or run data/hooslist-out/import.sql in the SQL Editor instead.`);
    process.exit(1);
  }

  const jsonPath = join(__dirname, "..", "data", "hooslist-out", "courses.json");
  const raw = await readFile(jsonPath, "utf8");
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows) || rows.length === 0) {
    console.error(`No rows in ${jsonPath}. Run npm run harvest:hooslist first.`);
    process.exit(1);
  }

  const sb = createClient(url, serviceKey);
  const chunkSize = 80;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize).map((r) => ({
      code: r.code,
      title: r.title ?? "TBD",
      credits: r.credits != null ? Number(r.credits) : 3,
      professor: r.professor ?? "TBD",
      description: r.description ?? "",
      majors: Array.isArray(r.majors) ? r.majors : [],
      tags: Array.isArray(r.tags) ? r.tags : [],
      category: r.category ?? "non_engineering",
    }));
    const { error } = await sb.from("courses").upsert(chunk, { onConflict: "code" });
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.error(`Upserted ${Math.min(i + chunkSize, rows.length)} / ${rows.length}`);
  }
  console.error(`Done. ${rows.length} courses in Supabase.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
