import { ELECTIVE_PREFIXES_BY_MAJOR } from "@/lib/elective-prefixes-by-major";

function subjectPrefixFromCode(code: string): string {
  const seg = code.trim().split(/\s+/)[0] ?? '';
  return seg.toUpperCase();
}

function catalogNumberFromCode(code: string): number {
  const m = code.trim().match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

/**
 * Degree elective / science bucket tags from UVA Undergraduate Record footnotes.
 * Tag shape: scope:bucket (ce:technical_elective_1, che:technical_elective, …).
 *
 * Sources: 2025–26 Undergraduate Record program pages (see data/catalog_sources_by_major.csv).
 *
 * Not modeled here (department lists / advising only): HSS; MAE & Aero “Math-Science/Technical” combined
 * elective (website list); BME electives (website); SYS engineering elective (website); generic unrestricted
 * electives. CpE depth pool uses catalog core exclusions only (still subject to “foundation overlap” rules).
 */

const NORM = (c: string) => c.trim().replace(/\s+/g, " ").toUpperCase();

const SEAS_ENGINEERING_SUBJECTS = new Set([
  "APMA", "BME", "CE", "CHE", "CS", "ECE", "ENGR", "MAE", "MSE", "SYS"
]);

const CIVIL_TECH_EXTRA_SUBJECTS = new Set([
  "BIOL", "CHEM", "MATH", "PHYS", "EVSC", "EVGE", "EVEC", "EVHY",
  "PLAN", "PLAC", "LAR", "ARCH", "DS", "COMM"
]);

const CIVIL_SCIENCE_I = new Set(
  [
    "BIOL 2100", "BIOL 2200", "CE 2001", "MSE 2090",
    "EVSC 2800", "EVSC 3200", "EVSC 3300"
  ].map(NORM)
);

const SEAS_MATH_SCIENCE_ELECTIVE_COMMON = new Set(
  [
    "BIOL 2100", "BIOL 2200", "CE 2001", "CHEM 1420",
    "EVSC 2800", "EVSC 3200", "EVSC 3300", "MSE 2090", "PHYS 2620"
  ].map(NORM)
);

const CIVIL_EWR_SCIENCE_II = new Set(
  [
    "BIOL 2100", "BIOL 2200", "BIOL 3090", "BIOL 3120", "CE 2001", "CHEM 1420",
    "ENGR 2500", "EVSC 2800", "EVSC 2900", "EVSC 3200", "EVSC 3300", "EVSC 3600",
    "EVSC 3860", "EVSC 4066", "EVSC 4090", "EVSC 4110", "EVSC 4140", "EVSC 4250",
    "EVSC 4270", "EVSC 4290", "EVSC 4850", "EVSC 4870", "EVSC 5060"
  ].map(NORM)
);

const CIVIL_EWR_ELECTIVE = new Set(
  ["CE 3120", "CE 4160", "CE 4100", "CE 4110", "CE 4210", "CE 5240"].map(NORM)
);

const CIVIL_CEM_ELECTIVE = new Set(
  [
    "CE 3010", "CE 3030", "CE 3400", "CE 4015", "CE 4025",
    "CE 4040", "CE 5035", "CE 5025"
  ].map(NORM)
);

const CIVIL_STRUCTURAL_DESIGN = new Set(
  ["CE 4320", "CE 4330", "CE 5300"].map(NORM)
);

const CHE_DEPARTMENT_ELECTIVE = new Set(
  [
    "CHE 3347", "CHE 4442", "CHE 4445", "CHE 4448", "CHE 4449",
    "CHE 4450", "CHE 4452", "CHE 4456", "CHE 4561", "CHE 4562"
  ].map(NORM)
);

/** MSE restricted electives (Undergraduate Record program notes fn. 4 / MSE electives list). */
const MSE_DEPARTMENT_ELECTIVE = new Set(
  [
    "MSE 2200",
    "MSE 2300",
    "MSE 3080",
    "MSE 3610",
    "MAE 3610",
    "MSE 4030",
    "MSE 4055",
    "MSE 4200",
    "MSE 4210",
    "MSE 4220",
    "MSE 4270",
    "MSE 4592",
    "MSE 4960"
  ].map(NORM)
);

const CHE_TECH_EXCLUDED_PHYS = new Set(["PHYS 2010", "PHYS 2020"].map(NORM));

/**
 * CpE “15 credits ECE or CS at 3000+” pool (Record): not the required ECE/CS core, not the capstone.
 * Foundation CS courses are excluded; advisors still apply overlap / digit rules for BSCS-style electives.
 */
const CPE_DEPTH_EXCLUDED_CORE = new Set(
  [
    "ECE 2330",
    "ECE 2300",
    "ECE 2700",
    "ECE 2600",
    "ECE 3430",
    "ECE 4435",
    "ECE 4440",
    "CS 2100",
    "CS 2120",
    "CS 2130",
    "CS 3100",
    "CS 3120",
    "CS 3130",
    "CS 3140"
  ].map(NORM)
);

function isCpeEceCsDepthElective(codeNorm: string, subj: string, n: number): boolean {
  if (subj !== "CS" && subj !== "ECE") return false;
  if (n < 3000) return false;
  if (CPE_DEPTH_EXCLUDED_CORE.has(codeNorm)) return false;
  return true;
}

/** MAE / Aero footnote (6): design capstone course options. */
const MAE_DESIGN_CAPSTONE = new Set(
  [
    "MAE 4610", "MAE 4620", "MAE 4630", "MAE 4640", "MAE 4670", "MAE 4680", "MAE 4790", "MAE 4800"
  ].map(NORM)
);

const NATURAL_SCIENCE_SUBJECTS = new Set(["BIOL", "CHEM", "PHYS", "EVSC", "ASTR"]);
function isCivilTechnicalCourse(codeNorm: string, subj: string, _n: number): boolean {
  if (subj === "STS") return false;
  if (codeNorm === "ENGR 2595") return false;
  if (SEAS_ENGINEERING_SUBJECTS.has(subj)) return true;
  if (CIVIL_TECH_EXTRA_SUBJECTS.has(subj)) return true;
  return false;
}

/** EE technical electives: engineering, math, or science 2000+ (catalog); align with ChE list plus BME. */
function isEeTechnicalElective(codeNorm: string, subj: string, n: number): boolean {
  if (isCheTechnicalElective(codeNorm, subj, n)) return true;
  if (subj === "BME" && n >= 2000 && n <= 5999) return true;
  return false;
}

function isCheTechnicalElective(codeNorm: string, subj: string, n: number): boolean {
  if (n < 2000 || n > 5999) return false;
  if (subj === "APMA" || subj === "MATH") return true;
  if (subj === "CHEM") return true;
  if (subj === "PHYS") return !CHE_TECH_EXCLUDED_PHYS.has(codeNorm);
  if (subj === "BIOL" || subj === "BIOM") return true;
  if (subj === "CHE") return true;
  if (subj === "ENGR") return true;
  if (subj === "CE" || subj === "CS") return true;
  if (subj === "ECE" && codeNorm !== "ECE 2066") return true;
  if (subj === "MSE" && codeNorm !== "MSE 2010") return true;
  if (subj === "MAE" || subj === "SYS") return true;
  if (subj === "ENVS") {
    return [2050, 2800, 3200, 3600, 3860, 4280, 4640, 4660, 4090].includes(n);
  }
  return false;
}

/** Engineering Science footnote (9): 3000+ in natural sciences or SEAS. */
function isEsAdvancedTechnicalElective(subj: string, n: number): boolean {
  if (n < 3000) return false;
  if (subj === "STS") return false;
  if (SEAS_ENGINEERING_SUBJECTS.has(subj)) return true;
  if (NATURAL_SCIENCE_SUBJECTS.has(subj)) return true;
  return false;
}

export function computeElectiveFulfillmentTags(courseCode: string): string[] {
  const code = NORM(courseCode);
  const subj = subjectPrefixFromCode(code);
  const n = catalogNumberFromCode(code);
  const tags = new Set<string>();

  if (CIVIL_SCIENCE_I.has(code)) {
    tags.add("ce:science_1");
    tags.add("ce:math_science_2");
  }
  if (SEAS_MATH_SCIENCE_ELECTIVE_COMMON.has(code)) {
    tags.add("seas:math_science_elective");
    tags.add("aero:math_science_elective");
    tags.add("mae:math_science_elective");
    tags.add("cpe:math_science_elective");
    tags.add("es:math_science_elective");
    tags.add("sys:math_science_elective_1");
  }
  if (subj === "APMA" && n >= 2000) {
    tags.add("seas:math_science_elective");
    tags.add("aero:math_science_elective");
    tags.add("mae:math_science_elective");
    tags.add("cpe:math_science_elective");
    tags.add("es:math_science_elective");
    tags.add("sys:math_science_elective_1");
    tags.add("ce:math_science_2");
  }
  if (code === "CHEM 1420" || code === "PHYS 2415" || code === "ECE 2200" || code === "EVSC 3600") {
    tags.add("ce:math_science_2");
  }
  if (code === "PHYS 2415" || code === "ECE 2200") {
    tags.add("seas:physics_2_alternative");
    tags.add("che:physics_2_alternative");
  }
  if (code === "PHYS 2419") tags.add("seas:physics_2_lab");

  if (CIVIL_EWR_SCIENCE_II.has(code)) tags.add("ce:ewr_science_2");

  if (code === "CHEM 1420" || code === "PHYS 2620") tags.add("es:science_elective");

  if ((subj === "APMA" || subj === "MATH") && n >= 3000) tags.add("es:advanced_math_cs_elective");
  if (subj === "CS" && n >= 2000) tags.add("es:advanced_math_cs_elective");

  if (isEsAdvancedTechnicalElective(subj, n)) tags.add("es:advanced_technical_elective");

  if (MAE_DESIGN_CAPSTONE.has(code)) {
    tags.add("mae:design_capstone");
    tags.add("aero:design_capstone");
  }

  if (subj === "CE" && n >= 3000) {
    tags.add("ce:ce_elective");
    if ((n >= 4500 && n < 4600) || (n >= 5500 && n < 5600) || code === "CE 5340" || code === "CE 5700") {
      tags.add("ce:se_elective");
    }
    if ((n >= 3500 && n < 3600) || (n >= 4500 && n < 4600)) tags.add("ce:cem_elective_series");
    if (n >= 4500 && n < 4600) tags.add("ce:ewr_elective_series");
    if ((n >= 4500 && n < 4600) || (n >= 5500 && n < 5600)) tags.add("ce:se_elective_series");
  }

  if (CIVIL_EWR_ELECTIVE.has(code)) tags.add("ce:ewr_elective");
  if (CIVIL_CEM_ELECTIVE.has(code)) tags.add("ce:cem_elective");
  if (CIVIL_STRUCTURAL_DESIGN.has(code)) {
    tags.add("ce:structural_design");
    tags.add("ce:se_elective");
  }

  const civilTech = isCivilTechnicalCourse(code, subj, n);
  if (civilTech && (code === "CHEM 1420" || n >= 2000)) tags.add("ce:technical_elective_1");
  if (civilTech && n >= 3000) tags.add("ce:technical_elective_2");

  if (isCheTechnicalElective(code, subj, n)) tags.add("che:technical_elective");
  if (CHE_DEPARTMENT_ELECTIVE.has(code)) tags.add("che:department_elective");

  if (isEeTechnicalElective(code, subj, n)) tags.add("ee:technical_elective");

  if (MSE_DEPARTMENT_ELECTIVE.has(code)) tags.add("mse:mse_elective");
  if (
    (subj === "CHEM" && (code === "CHEM 3410" || code === "CHEM 3610")) ||
    (subj === "APMA" && n >= 3000)
  ) {
    tags.add("mse:math_science_elective_2");
  }

  if (isCpeEceCsDepthElective(code, subj, n)) tags.add("cpe:ece_cs_depth_elective");

  return [...tags].sort();
}

/**
 * Prefer saved catalog tags when present; otherwise derive degree-elective labels from course code (footnote rules).
 */
export function resolveElectiveFulfillmentsForCourse(
  courseCode: string,
  fromDatabase: string[] | null | undefined
): string[] {
  const fromDb = fromDatabase?.filter((t) => String(t).trim()) ?? [];
  if (fromDb.length > 0) return fromDb;
  return computeElectiveFulfillmentTags(courseCode);
}

/** Human-readable labels for dashboard / course `tags` column (Undergraduate Record footnotes). */
const DEGREE_ELECTIVE_FULFILLMENT_LABELS: Record<string, string> = {
  "ce:science_1": "Civil · Science elective I",
  "ce:math_science_2": "Civil · Math/Science II",
  "ce:technical_elective_1": "Civil · Technical elective I",
  "ce:technical_elective_2": "Civil · Technical elective II",
  "ce:ewr_science_2": "Civil (EWR) · Science II",
  "ce:ewr_elective": "Civil (EWR) · Track elective",
  "ce:cem_elective": "Civil (CEM) · Track elective",
  "ce:structural_design": "Civil (SE) · Structural design",
  "ce:ce_elective": "Civil · CE elective",
  "ce:se_elective": "Civil · Structural eng. elective",
  "ce:cem_elective_series": "Civil · CEM elective series",
  "ce:ewr_elective_series": "Civil · EWR elective series",
  "ce:se_elective_series": "Civil · SE elective series",
  "seas:math_science_elective": "SEAS · Math/Science elective",
  "aero:math_science_elective": "Aerospace · Math/Science elective",
  "mae:math_science_elective": "Mechanical · Math/Science elective",
  "cpe:math_science_elective": "Computer Eng. · Math/Science elective",
  "cpe:ece_cs_depth_elective": "Computer Eng. · ECE/CS depth (3000+)",
  "es:math_science_elective": "Engineering Science · Math/Science elective",
  "sys:math_science_elective_1": "Systems · Math/Science elective I",
  "che:technical_elective": "Chemical · Technical elective",
  "che:department_elective": "Chemical · ChE elective",
  "ee:technical_elective": "Electrical · Technical elective",
  "mse:mse_elective": "Materials Sci. · MSE elective",
  "mse:math_science_elective_2": "Materials Sci. · Math/Science II",
  "es:science_elective": "Eng. Sci. · Science elective",
  "es:advanced_math_cs_elective": "Eng. Sci. · Adv. math/CS elective",
  "es:advanced_technical_elective": "Eng. Sci. · Adv. technical elective",
  "mae:design_capstone": "Mechanical · Design capstone",
  "aero:design_capstone": "Aerospace · Design capstone",
  "seas:physics_2_alternative": "SEAS · Physics II option",
  "che:physics_2_alternative": "Chemical · Physics II option",
  "seas:physics_2_lab": "SEAS · Physics II lab"
};

/**
 * Section order on the Engineering Courses tab (first matching tag on a course wins).
 * Aligns with common catalog priority: design → CpE depth → Civil track buckets → department electives → technical → math/science → physics options.
 */
export const ELECTIVE_FULFILLMENT_SECTION_ORDER: readonly string[] = [
  "mae:design_capstone",
  "aero:design_capstone",
  "cpe:ece_cs_depth_elective",
  "ce:structural_design",
  "ce:ewr_elective",
  "ce:cem_elective",
  "ce:se_elective",
  "ce:ewr_elective_series",
  "ce:cem_elective_series",
  "ce:se_elective_series",
  "ce:ewr_science_2",
  "che:department_elective",
  "mse:mse_elective",
  "ce:ce_elective",
  "ce:technical_elective_1",
  "ce:technical_elective_2",
  "che:technical_elective",
  "ee:technical_elective",
  "es:advanced_technical_elective",
  "ce:science_1",
  "ce:math_science_2",
  "seas:math_science_elective",
  "aero:math_science_elective",
  "mae:math_science_elective",
  "cpe:math_science_elective",
  "es:math_science_elective",
  "sys:math_science_elective_1",
  "mse:math_science_elective_2",
  "es:science_elective",
  "es:advanced_math_cs_elective",
  "seas:physics_2_alternative",
  "che:physics_2_alternative",
  "seas:physics_2_lab"
];

/** Bucket for courses with no `electiveFulfillments` tags. */
export const ELECTIVE_SECTION_UNTAGGED = "__untagged__";

export function titleForElectiveFulfillmentTag(tag: string): string {
  if (tag === ELECTIVE_SECTION_UNTAGGED) return "Other pool courses";
  return DEGREE_ELECTIVE_FULFILLMENT_LABELS[tag] ?? tag.replace(/:/g, " · ");
}

/**
 * One tab section per course: highest-priority fulfillment tag on the course, else first labeled tag, else first raw tag.
 */
export function pickPrimaryElectiveSectionTag(fulfillments: string[] | undefined): string | null {
  const f = fulfillments?.filter((t) => t?.trim()) ?? [];
  if (!f.length) return null;
  const set = new Set(f);
  for (const t of ELECTIVE_FULFILLMENT_SECTION_ORDER) {
    if (set.has(t)) return t;
  }
  const labeled = [...f].sort((a, b) => a.localeCompare(b)).find((t) => t in DEGREE_ELECTIVE_FULFILLMENT_LABELS);
  if (labeled) return labeled;
  return f[0];
}

function pickFirstTagFromPool(pool: string[]): string | null {
  if (!pool.length) return null;
  const set = new Set(pool);
  for (const t of ELECTIVE_FULFILLMENT_SECTION_ORDER) {
    if (set.has(t)) return t;
  }
  const labeled = [...pool].sort((a, b) => a.localeCompare(b)).find((t) => t in DEGREE_ELECTIVE_FULFILLMENT_LABELS);
  if (labeled) return labeled;
  return pool[0] ?? null;
}

/**
 * Primary section tag for the student’s major: prefer buckets from their program’s catalog (`ce:` for Civil only,
 * `seas:` for shared pools, etc.). Avoids showing Civil-specific headings when the profile major is something else.
 */
export function pickPrimaryElectiveSectionTagForMajor(
  fulfillments: string[] | undefined,
  major: string
): string | null {
  const f = fulfillments?.filter((t) => String(t).trim()) ?? [];
  if (!f.length) return null;

  const majorTrim = major?.trim() ?? "";
  const prefixes = majorTrim ? ELECTIVE_PREFIXES_BY_MAJOR[majorTrim] : null;

  let pool: string[];
  if (!prefixes?.length) {
    pool = f;
  } else {
    const preferred = f.filter((t) => prefixes.some((p) => t.startsWith(p)));
    if (preferred.length > 0) {
      pool = preferred;
    } else {
      const universal = f.filter((t) => t.startsWith("seas:") || t.startsWith("sys:"));
      if (universal.length > 0) {
        pool = universal;
      } else if (majorTrim !== "Civil Engineering") {
        pool = f.filter((t) => !t.startsWith("ce:"));
      } else {
        pool = f;
      }
    }
  }

  return pickFirstTagFromPool(pool);
}

/** Prefix for strings merged into `courses.tags` by the recompute script (idempotent updates). */
export const DEGREE_ELECTIVE_TAG_PREFIX = "UVA degree elective · ";

export function humanLabelsForElectiveFulfillments(fulfillments: string[]): string[] {
  return fulfillments.map((t) => DEGREE_ELECTIVE_FULFILLMENT_LABELS[t] ?? t.replace(/:/g, " · "));
}

/** Tags to store on each course row (Hooslist-safe; avoids duplicating footnote logic in SQL). */
export function courseTagsForElectiveFulfillments(fulfillments: string[]): string[] {
  return humanLabelsForElectiveFulfillments(fulfillments).map((l) => DEGREE_ELECTIVE_TAG_PREFIX + l);
}
