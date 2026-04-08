import type { StudentProfileInput } from "@/types/domain";

/** Payload stored in Supabase `student_profiles` + `student_goals` (no completions here). */
export type SavedProfilePayload = Pick<
  StudentProfileInput,
  | "uvaEmail"
  | "major"
  | "majorTrack"
  | "graduationYear"
  | "researchGoal"
  | "internshipGoal"
  | "studyAbroadGoal"
  | "studyAbroadInterests"
  | "outsideInterests"
  | "outsideInterestDetails"
>;

export function stripToSavedPayload(profile: StudentProfileInput): SavedProfilePayload {
  return {
    uvaEmail: profile.uvaEmail?.trim() ? profile.uvaEmail.trim().toLowerCase() : undefined,
    major: profile.major,
    majorTrack: profile.majorTrack,
    graduationYear: profile.graduationYear,
    researchGoal: profile.researchGoal,
    internshipGoal: profile.internshipGoal,
    studyAbroadGoal: profile.studyAbroadGoal,
    studyAbroadInterests: profile.studyAbroadInterests ?? [],
    outsideInterests: profile.outsideInterests ?? [],
    outsideInterestDetails: profile.outsideInterestDetails ?? []
  };
}

export type ProfileGetResponse = { saved: false } | ({ saved: true } & SavedProfilePayload);

export function parseSavedProfileJson(json: unknown): SavedProfilePayload | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  if (typeof o.major !== "string" || typeof o.graduationYear !== "string") return null;
  const uvaEmailRaw = o.uvaEmail;
  return {
    uvaEmail: typeof uvaEmailRaw === "string" && uvaEmailRaw.trim() ? uvaEmailRaw.trim().toLowerCase() : undefined,
    major: o.major,
    majorTrack: typeof o.majorTrack === "string" ? o.majorTrack : undefined,
    graduationYear: o.graduationYear,
    researchGoal: typeof o.researchGoal === "string" ? o.researchGoal : "",
    internshipGoal: typeof o.internshipGoal === "string" ? o.internshipGoal : "",
    studyAbroadGoal: typeof o.studyAbroadGoal === "string" ? o.studyAbroadGoal : "",
    studyAbroadInterests: Array.isArray(o.studyAbroadInterests)
      ? (o.studyAbroadInterests as string[]).map((x) => String(x).toLowerCase().trim()).filter(Boolean)
      : [],
    outsideInterests: Array.isArray(o.outsideInterests) ? (o.outsideInterests as string[]) : [],
    outsideInterestDetails: Array.isArray(o.outsideInterestDetails)
      ? (o.outsideInterestDetails as string[])
      : []
  };
}
