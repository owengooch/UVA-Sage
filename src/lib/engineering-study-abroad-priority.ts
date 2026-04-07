import type { StudyAbroadProgram } from "@/types/domain";

/**
 * Programs that are especially relevant for UVA Engineering students.
 * Heuristic: title/subject metadata from the ISO listing — not a formal degree audit.
 */
export function isEngineeringFocusStudyAbroad(p: StudyAbroadProgram): boolean {
  const t = p.title.toLowerCase();
  if (t.includes("engineering")) return true;
  if (t.includes("dgist")) return true;
  if (t.includes("tu dortmund")) return true;
  if (t.includes("global technology practice")) return true;
  if (t.includes("global technology consulting")) return true;
  if ((p.subjectAreas ?? []).some((s) => /engineering/i.test(s))) return true;
  return false;
}

export function profileLooksEngineeringMajor(major: string | undefined): boolean {
  return (major ?? "").toLowerCase().includes("engineering");
}

/** Extra overlap points so these programs surface for engineering majors even with vague study-abroad goals. */
export const ENGINEERING_STUDY_ABROAD_SCORE_BONUS = 5;
