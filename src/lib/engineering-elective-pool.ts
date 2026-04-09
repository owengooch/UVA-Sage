import { ELECTIVE_PREFIXES_BY_MAJOR } from "@/lib/elective-prefixes-by-major";
import { catalogNumberFromCode, subjectPrefixFromCode } from "@/lib/course-interest-match";
import type { Course, StudentProfileInput } from "@/types/domain";

/**
 * Subjects that normally count as HSS / general humanities (not technical / math–science / engineering
 * elective buckets for the Engineering Courses tab).
 */
const LIKELY_HSS_SUBJECTS = new Set([
  "AAS",
  "AMST",
  "ANTH",
  "ARTH",
  "ARTS",
  "CLAS",
  "DANC",
  "DRAM",
  "ECON",
  "ENAM",
  "ENCW",
  "ENGL",
  "EURO",
  "FREN",
  "GERM",
  "HIAF",
  "HIST",
  "ITAL",
  "JWST",
  "LATI",
  "LING",
  "MDST",
  "MUSI",
  "PPL",
  "PHIL",
  "PLAD",
  "PLCP",
  "PLIR",
  "POL",
  "PPOL",
  "PSYC",
  "RELG",
  "RUSS",
  "SAST",
  "SPAN",
  "WGS"
]);

/** Catalog subjects that can appear as `category: elective` for SEAS / STEM electives. */
const SEAS_ELECTIVE_SUBJECTS = new Set([
  "APMA",
  "BME",
  "CE",
  "CHE",
  "CHEM",
  "CS",
  "ECE",
  "ENGR",
  "MAE",
  "MSE",
  "SYS",
  "BIOL",
  "PHYS",
  "STAT",
  "EVSC",
  "MATH"
]);

/** Typical math / science elective subjects (shared across majors). */
const STEM_MATH_SCIENCE_SUBJECTS = new Set([
  "APMA",
  "CHEM",
  "PHYS",
  "BIOL",
  "MATH",
  "STAT",
  "EVSC",
  "ASTR"
]);

/** Home department mnemonics for each B.S. (plus ENGR) for untagged elective rows. */
const DEPT_SUBJECTS_BY_MAJOR: Record<string, Set<string>> = {
  "Aerospace Engineering": new Set(["MAE", "ENGR"]),
  "Biomedical Engineering": new Set(["BME", "ENGR"]),
  "Chemical Engineering": new Set(["CHE", "ENGR"]),
  "Civil Engineering": new Set(["CE", "ENGR"]),
  "Computer Engineering": new Set(["CS", "ECE", "ENGR"]),
  "Computer Science (Engineering)": new Set(["CS", "ENGR"]),
  "Electrical Engineering": new Set(["ECE", "ENGR"]),
  "Materials Science and Engineering": new Set(["MSE", "ENGR"]),
  "Mechanical Engineering": new Set(["MAE", "ENGR"]),
  "Systems Engineering": new Set(["SYS", "ENGR"])
};

/** Degree-elective fulfillment buckets (not HSS / unrestricted — we never tag those). */
const DEGREE_ELECTIVE_TAG_RE = /^(ce|che|cpe|ee|mse|mae|aero|sys|es|seas):/i;

function hasEngineeringDegreeElectiveTag(course: Course): boolean {
  return (course.electiveFulfillments ?? []).some((t) => DEGREE_ELECTIVE_TAG_RE.test(t.trim()));
}

function isUntaggedSeasElectiveRow(course: Course): boolean {
  if (course.category !== "elective") return false;
  return SEAS_ELECTIVE_SUBJECTS.has(subjectPrefixFromCode(course.code));
}

function isBscsElectivePoolShape(course: Course, major: string): boolean {
  if (major !== "Computer Science (Engineering)") return false;
  const code = course.code.trim().replace(/\s+/g, " ").toUpperCase();
  if (!code.startsWith("CS ")) return false;
  const n = catalogNumberFromCode(code);
  if (n < 3000) return false;
  const foundation = new Set([
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
  ]);
  if (foundation.has(code)) return false;
  const mid = Math.floor((n % 1000) / 100);
  if (mid === 0 || mid === 9) return code.includes("4993");
  return true;
}

function fulfillmentMatchesMajor(course: Course, major: string): boolean {
  const prefixes = ELECTIVE_PREFIXES_BY_MAJOR[major];
  if (!prefixes?.length) return false;
  const fulfill = course.electiveFulfillments ?? [];
  return fulfill.some((tag) => prefixes.some((p) => tag.startsWith(p)));
}

function untaggedElectiveFitsMajor(course: Course, major: string): boolean {
  if (!isUntaggedSeasElectiveRow(course)) return false;
  if ((course.electiveFulfillments ?? []).length > 0) return false;
  const sub = subjectPrefixFromCode(course.code);
  if (STEM_MATH_SCIENCE_SUBJECTS.has(sub)) return true;
  const dept = DEPT_SUBJECTS_BY_MAJOR[major];
  return dept?.has(sub) ?? false;
}

function passesNotHssUnlessTagged(course: Course): boolean {
  const sub = subjectPrefixFromCode(course.code);
  if (!LIKELY_HSS_SUBJECTS.has(sub)) return true;
  return hasEngineeringDegreeElectiveTag(course);
}

/**
 * Math/science elective options are often `non_engineering` in the catalog (e.g. BIOL, CHEM) but still count
 * toward SEAS math/science pools once tagged — or are obvious 2000+ science/math candidates before backfill.
 */
function stemNonEngineeringFitsDegreeElective(course: Course, major: string): boolean {
  if (!major || course.category !== "non_engineering") return false;
  const sub = subjectPrefixFromCode(course.code);
  if (!STEM_MATH_SCIENCE_SUBJECTS.has(sub)) return false;
  if (fulfillmentMatchesMajor(course, major)) return true;
  return catalogNumberFromCode(course.code) >= 2000;
}

function includeInDegreeElectivePool(course: Course, major: string): boolean {
  if (!passesNotHssUnlessTagged(course)) return false;
  if (!major) return hasEngineeringDegreeElectiveTag(course) && !isOnlyEngineeringScienceTags(course);

  if (fulfillmentMatchesMajor(course, major)) return true;
  if (isBscsElectivePoolShape(course, major)) return true;
  if (untaggedElectiveFitsMajor(course, major)) return true;
  if (stemNonEngineeringFitsDegreeElective(course, major)) return true;
  return false;
}

/** Eng. Sci. degree tags are omitted from our major list; do not use as generic recommendations. */
function isOnlyEngineeringScienceTags(course: Course): boolean {
  const f = course.electiveFulfillments ?? [];
  if (f.length === 0) return false;
  return f.every((t) => t.trim().toLowerCase().startsWith("es:"));
}

/**
 * Courses for the Engineering Courses tab: catalog degree-elective buckets for this major (technical,
 * department electives, math/science pools, etc.). Excludes typical HSS subjects and does not model
 * unrestricted electives.
 */
export function buildEngineeringDegreeElectivePool(
  electiveCourses: Course[],
  nonEngineeringCourses: Course[],
  profile: Pick<StudentProfileInput, "major">
): Course[] {
  const major = profile.major?.trim() ?? "";
  const byCode = new Map<string, Course>();

  const consider = (c: Course) => {
    if (!includeInDegreeElectivePool(c, major)) return;
    const code = c.code.trim();
    if (!byCode.has(code)) byCode.set(code, c);
  };

  for (const c of electiveCourses) consider(c);
  for (const c of nonEngineeringCourses) consider(c);

  return [...byCode.values()];
}

/**
 * If nothing matches tagged rules (e.g. elective_fulfillments not backfilled), still show SEAS/STEM
 * electives rather than an empty tab.
 */
export function buildEngineeringDegreeElectivePoolWithFallback(
  electiveCourses: Course[],
  nonEngineeringCourses: Course[],
  profile: Pick<StudentProfileInput, "major">
): Course[] {
  const primary = buildEngineeringDegreeElectivePool(electiveCourses, nonEngineeringCourses, profile);
  if (primary.length > 0) return primary;
  return electiveCourses.filter((c) => {
    if (!passesNotHssUnlessTagged(c)) return false;
    return SEAS_ELECTIVE_SUBJECTS.has(subjectPrefixFromCode(c.code));
  });
}
