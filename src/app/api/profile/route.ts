import { NextResponse } from "next/server";
import { parseSavedProfileJson, type ProfileGetResponse, type SavedProfilePayload } from "@/lib/saved-profile";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: profile, error: pErr } = await supabase
    .from("student_profiles")
    .select("id, major, graduation_year, outside_interests, outside_interest_details, major_track")
    .eq("user_id", user.id)
    .maybeSingle();

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ saved: false } satisfies ProfileGetResponse);
  }

  const { data: goals, error: gErr } = await supabase
    .from("student_goals")
    .select("research_goal, internship_goal, study_abroad_goal, study_abroad_interests")
    .eq("profile_id", profile.id)
    .limit(1)
    .maybeSingle();

  if (gErr) {
    return NextResponse.json({ error: gErr.message }, { status: 500 });
  }

  const payload: Extract<ProfileGetResponse, { saved: true }> = {
    saved: true,
    major: profile.major as string,
    majorTrack: (profile.major_track as string | null) ?? undefined,
    graduationYear: profile.graduation_year as string,
    outsideInterests: (profile.outside_interests as string[]) ?? [],
    outsideInterestDetails: (profile.outside_interest_details as string[]) ?? [],
    researchGoal: (goals?.research_goal as string) ?? "",
    internshipGoal: (goals?.internship_goal as string) ?? "",
    studyAbroadGoal: (goals?.study_abroad_goal as string) ?? "",
    studyAbroadInterests: Array.isArray(goals?.study_abroad_interests)
      ? ((goals?.study_abroad_interests as string[]) ?? []).map((x) => x.toLowerCase().trim()).filter(Boolean)
      : []
  };

  return NextResponse.json(payload);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to save your profile to your account." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = parseSavedProfileJson(body);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid profile payload." }, { status: 400 });
  }

  const {
    major,
    majorTrack,
    graduationYear,
    outsideInterests,
    outsideInterestDetails,
    researchGoal,
    internshipGoal,
    studyAbroadGoal,
    studyAbroadInterests
  } = parsed;

  const { data: existing, error: findErr } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (findErr) {
    return NextResponse.json({ error: findErr.message }, { status: 500 });
  }

  const now = new Date().toISOString();

  if (existing?.id) {
    const { error: uErr } = await supabase
      .from("student_profiles")
      .update({
        major,
        graduation_year: graduationYear,
        outside_interests: outsideInterests,
        outside_interest_details: outsideInterestDetails,
        major_track: majorTrack?.trim() || null,
        updated_at: now
      })
      .eq("id", existing.id);

    if (uErr) {
      return NextResponse.json({ error: uErr.message }, { status: 500 });
    }

    const { data: goalRow } = await supabase
      .from("student_goals")
      .select("id")
      .eq("profile_id", existing.id)
      .limit(1)
      .maybeSingle();

    if (goalRow) {
      const { error: gErr } = await supabase
        .from("student_goals")
        .update({
          research_goal: researchGoal,
          internship_goal: internshipGoal,
          study_abroad_goal: studyAbroadGoal,
          study_abroad_interests: studyAbroadInterests
        })
        .eq("profile_id", existing.id);

      if (gErr) {
        return NextResponse.json({ error: gErr.message }, { status: 500 });
      }
    } else {
      const { error: giErr } = await supabase.from("student_goals").insert({
        profile_id: existing.id,
        research_goal: researchGoal,
        internship_goal: internshipGoal,
        study_abroad_goal: studyAbroadGoal,
        study_abroad_interests: studyAbroadInterests
      });
      if (giErr) {
        return NextResponse.json({ error: giErr.message }, { status: 500 });
      }
    }
  } else {
    const { data: inserted, error: iErr } = await supabase
      .from("student_profiles")
      .insert({
        user_id: user.id,
        major,
        graduation_year: graduationYear,
        outside_interests: outsideInterests,
        outside_interest_details: outsideInterestDetails,
        major_track: majorTrack?.trim() || null,
        updated_at: now
      })
      .select("id")
      .single();

    if (iErr || !inserted) {
      return NextResponse.json({ error: iErr?.message ?? "Insert failed." }, { status: 500 });
    }

    const { error: gErr } = await supabase.from("student_goals").insert({
      profile_id: inserted.id,
      research_goal: researchGoal,
      internship_goal: internshipGoal,
      study_abroad_goal: studyAbroadGoal,
      study_abroad_interests: studyAbroadInterests
    });

    if (gErr) {
      return NextResponse.json({ error: gErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
