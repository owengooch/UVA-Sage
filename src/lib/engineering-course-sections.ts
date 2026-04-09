import { compareCourseCodesByCatalog, catalogNumberFromCode } from "@/lib/course-interest-match";
import { courseAlignsWithStudentTrack, trackSubgroupingSupported } from "@/lib/engineering-track-course-match";
import { trackLabelForValue } from "@/lib/major-tracks";
import type { Course, RecommendedItem, StudentProfileInput } from "@/types/domain";

export type EngineeringCourseSectionId =
  | "design_capstone"
  | "cpe_ece_cs_depth"
  | "major_and_track_electives"
  | "technical_electives"
  | "math_and_science_electives"
  | "cs_upper_level"
  | "other_options";

const ENGINEERING_SECTION_ORDER: EngineeringCourseSectionId[] = [
  "design_capstone",
  "cpe_ece_cs_depth",
  "major_and_track_electives",
  "technical_electives",
  "math_and_science_electives",
  "cs_upper_level",
  "other_options"
];

const ENGINEERING_SECTION_META: Record<
  EngineeringCourseSectionId,
  { title: string; description: string }
> = {
  design_capstone: {
    title: "Design & capstone options",
    description:
      "Department design sequences and capstone-style courses that satisfy degree design requirements (e.g. MAE / Aero design I–II)."
  },
  cpe_ece_cs_depth: {
    title: "Computer Engineering · ECE / CS depth",
    description:
      "Upper-level ECE or CS courses that typically count toward the CpE fifteen-credit depth block (3000+; see catalog for core exclusions)."
  },
  major_and_track_electives: {
    title: "Major & track electives",
    description:
      "Department electives and track-specific slots — ChE electives, MSE electives, Civil CE / EWR / CEM / SE buckets, etc."
  },
  technical_electives: {
    title: "Technical electives",
    description:
      "Courses that commonly satisfy technical-elective rules (engineering, math, and science at the levels defined in your program footnotes)."
  },
  math_and_science_electives: {
    title: "Math & science electives",
    description:
      "Shared SEAS math/science pools, Civil science buckets, probability/linear algebra add-ons, and similar catalog slots."
  },
  cs_upper_level: {
    title: "Computer science electives",
    description:
      "Upper-level CS courses that usually count toward BS CS elective credit (confirm digit and overlap rules in the catalog)."
  },
  other_options: {
    title: "More options",
    description:
      "Additional courses in your recommendation list that are not classified above — still worth exploring with your advisor."
  }
};

const MAJOR_TRACK_CE_TAGS = new Set([
  "ce:ce_elective",
  "ce:ewr_elective",
  "ce:cem_elective",
  "ce:structural_design",
  "ce:se_elective",
  "ce:cem_elective_series",
  "ce:ewr_elective_series",
  "ce:se_elective_series"
]);

const BSCS_EXCLUDE = new Set(
  [
    "CS 2100",
    "CS 2120",
    "CS 2130",
    "CS 3100",
    "CS 3120",
    "CS 3130",
    "CS 3140",
    "CS 3240",
    "CS 4971",
    "CS 4980",
    "CS 4991"
  ].map((c) => c.toUpperCase())
);

function isBscsElectiveShape(course: Course): boolean {
  const code = course.code.trim().replace(/\s+/g, " ").toUpperCase();
  if (!code.startsWith("CS ")) return false;
  const n = catalogNumberFromCode(code);
  if (n < 3000) return false;
  if (BSCS_EXCLUDE.has(code)) return false;
  const mid = Math.floor((n % 1000) / 100);
  if (mid === 0 || mid === 9) return code.includes("4993");
  return true;
}

/**
 * One primary section per course (first matching bucket wins by program priority).
 */
export function engineeringCourseSectionId(course: Course, major: string): EngineeringCourseSectionId {
  const f = course.electiveFulfillments ?? [];
  const has = (fn: (t: string) => boolean) => f.some(fn);

  if (has((t) => t.includes("design_capstone"))) return "design_capstone";
  if (has((t) => t === "cpe:ece_cs_depth_elective")) return "cpe_ece_cs_depth";

  if (
    has((t) => t === "che:department_elective" || t === "mse:mse_elective") ||
    has((t) => MAJOR_TRACK_CE_TAGS.has(t))
  ) {
    return "major_and_track_electives";
  }

  if (
    has((t) => t.includes("technical_elective")) ||
    has((t) => t === "che:technical_elective" || t === "ee:technical_elective") ||
    has((t) => t === "es:advanced_technical_elective" || t === "es:advanced_math_cs_elective")
  ) {
    return "technical_electives";
  }

  if (
    has((t) => t.startsWith("seas:")) ||
    has((t) => t.startsWith("sys:math_science")) ||
    has((t) => t === "ce:science_1" || t === "ce:math_science_2" || t === "ce:ewr_science_2") ||
    has((t) => t === "mse:math_science_elective_2") ||
    has((t) => t === "es:math_science_elective" || t === "es:science_elective")
  ) {
    return "math_and_science_electives";
  }

  if (major === "Computer Science (Engineering)" && isBscsElectiveShape(course)) {
    return "cs_upper_level";
  }

  return "other_options";
}

export type EngineeringCourseSubsection = {
  key: string;
  /** Empty when the whole section is a single grid (no track split). */
  title: string;
  items: RecommendedItem<Course>[];
};

export type EngineeringCourseSection = {
  id: EngineeringCourseSectionId;
  title: string;
  description: string;
  subsections: EngineeringCourseSubsection[];
};

function sortRecommendedItems(items: RecommendedItem<Course>[]): RecommendedItem<Course>[] {
  return [...items].sort(
    (a, b) => b.score - a.score || compareCourseCodesByCatalog(a.item.code, b.item.code)
  );
}

/**
 * When the student chose a catalog track (Civil) or a configured focus path, split into “strong fit” vs “also consider”
 * if both sides are non-empty; otherwise one grid.
 */
function subsectionItemsForSection(
  items: RecommendedItem<Course>[],
  profile: Pick<StudentProfileInput, "major" | "majorTrack">
): EngineeringCourseSubsection[] {
  const major = profile.major?.trim() ?? "";
  const track = profile.majorTrack?.trim() ?? "";
  if (!trackSubgroupingSupported(major, track)) {
    return [{ key: "all", title: "", items: sortRecommendedItems(items) }];
  }

  const aligned: RecommendedItem<Course>[] = [];
  const other: RecommendedItem<Course>[] = [];
  for (const rec of items) {
    if (courseAlignsWithStudentTrack(rec.item, profile)) aligned.push(rec);
    else other.push(rec);
  }

  if (aligned.length === 0 || other.length === 0) {
    const merged = aligned.length > 0 ? aligned : other;
    return [{ key: "all", title: "", items: sortRecommendedItems(merged) }];
  }

  const tl = trackLabelForValue(major, track);
  return [
    {
      key: "track",
      title: tl ? `Strong fit · ${tl}` : "Strong fit for your track",
      items: sortRecommendedItems(aligned)
    },
    { key: "other", title: "Also in this category", items: sortRecommendedItems(other) }
  ];
}

export function groupEngineeringRecommendations(
  items: RecommendedItem<Course>[],
  profile: Pick<StudentProfileInput, "major" | "majorTrack">
): EngineeringCourseSection[] {
  const major = profile.major?.trim() ?? "";
  const buckets = new Map<EngineeringCourseSectionId, RecommendedItem<Course>[]>();
  for (const id of ENGINEERING_SECTION_ORDER) buckets.set(id, []);

  for (const rec of items) {
    const id = engineeringCourseSectionId(rec.item, major);
    buckets.get(id)!.push(rec);
  }

  return ENGINEERING_SECTION_ORDER.map((id) => {
    const raw = buckets.get(id) ?? [];
    if (raw.length === 0) return null;
    const meta = ENGINEERING_SECTION_META[id];
    return {
      id,
      title: meta.title,
      description: meta.description,
      subsections: subsectionItemsForSection(raw, profile)
    };
  }).filter((s): s is EngineeringCourseSection => s !== null);
}
