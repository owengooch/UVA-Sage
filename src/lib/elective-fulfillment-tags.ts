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
 * Not tagged automatically (advisor / department list only): HSS; MAE/Aero math-science/technical
 * combined elective (footnote 2); BME electives page; CpE 15cr ECE/CS depth; generic engineering elective;
 * unrestricted electives.
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

const CHE_TECH_EXCLUDED_PHYS = new Set(["PHYS 2010", "PHYS 2020"].map(NORM));

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
  }
  if (subj === "APMA" && n >= 2000) {
    tags.add("seas:math_science_elective");
    tags.add("aero:math_science_elective");
    tags.add("mae:math_science_elective");
    tags.add("cpe:math_science_elective");
    tags.add("es:math_science_elective");
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

  return [...tags].sort();
}
