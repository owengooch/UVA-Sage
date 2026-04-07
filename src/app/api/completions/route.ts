import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function parseCourseCodes(body: unknown): string[] | null {
  if (!body || typeof body !== "object" || !("courseCodes" in body)) return null;
  const raw = (body as { courseCodes: unknown }).courseCodes;
  if (!Array.isArray(raw)) return null;
  const codes: string[] = [];
  for (const x of raw) {
    if (typeof x !== "string") return null;
    const t = x.trim();
    if (t.length === 0 || t.length > 64) return null;
    codes.push(t);
  }
  return Array.from(new Set(codes));
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ courseCodes: [], authenticated: false });
  }

  const { data, error } = await supabase.from("student_course_completions").select("course_code").eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message, authenticated: true, courseCodes: [] }, { status: 500 });
  }

  const courseCodes = (data ?? []).map((r) => r.course_code as string);
  return NextResponse.json({ courseCodes, authenticated: true });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to sync completions to your account." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const courseCodes = parseCourseCodes(json);
  if (!courseCodes) {
    return NextResponse.json({ error: "Expected { courseCodes: string[] }." }, { status: 400 });
  }

  const { error: delErr } = await supabase.from("student_course_completions").delete().eq("user_id", user.id);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  if (courseCodes.length > 0) {
    const rows = courseCodes.map((course_code) => ({ user_id: user.id, course_code }));
    const { error: insErr } = await supabase.from("student_course_completions").insert(rows);
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
