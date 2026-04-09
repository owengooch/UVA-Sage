import type { StudentProfileInput } from "@/types/domain";

/**
 * Normalizes `text[]` from Postgres/PostgREST (or a single string / JSON string) into trimmed lowercase tokens.
 */
export function coerceDbTextArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((x) => String(x).toLowerCase().trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return [];
    if (t.startsWith("{") && t.endsWith("}")) {
      const inner = t.slice(1, -1).trim();
      if (!inner) return [];
      return inner
        .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
        .map((part) => part.trim().replace(/^"(.*)"$/, "$1").toLowerCase().trim())
        .filter(Boolean);
    }
    try {
      const parsed = JSON.parse(t) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((x) => String(x).toLowerCase().trim()).filter(Boolean);
      }
    } catch {
      /* single token */
    }
    return [t.toLowerCase()];
  }
  return [];
}

/** Payload stored in Supabase `student_profiles` + `student_goals` (no completions here). */
export type SavedProfilePayload = Pick<
  StudentProfileInput,
  | "sageUsername"
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
    sageUsername: profile.sageUsername?.trim() || undefined,
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
  const sageRaw = o.sageUsername;
  return {
    sageUsername: typeof sageRaw === "string" && sageRaw.trim() ? sageRaw.trim().toLowerCase() : undefined,
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
    outsideInterests: coerceDbTextArray(o.outsideInterests),
    outsideInterestDetails: coerceDbTextArray(o.outsideInterestDetails)
  };
}
