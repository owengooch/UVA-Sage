import type { Course } from "@/types/domain";

/** Values that mean "no assigned instructor" in imported catalog rows. */
const NO_INSTRUCTOR_TOKENS = new Set([
  "tbd",
  "staff",
  "n/a",
  "na",
  "unknown",
  "pending",
  "tba",
  "none"
]);

/**
 * Returns a display-safe instructor name, or undefined when the database/catalog
 * has no real instructor data.
 */
export function professorFromDb(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const t = value.trim();
  if (!t) return undefined;
  const lower = t.toLowerCase();
  if (NO_INSTRUCTOR_TOKENS.has(lower)) return undefined;
  return t;
}

/** Drop or normalize `professor` on a course for UI / API responses. */
export function withNormalizedProfessor(course: Course): Course {
  const p = professorFromDb(course.professor ?? null);
  if (p === undefined) {
    const { professor: _omit, ...rest } = course;
    return rest as Course;
  }
  return { ...course, professor: p };
}
