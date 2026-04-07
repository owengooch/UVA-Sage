/**
 * Keeps Beyond Engineering rankings aligned with explicit outside interests,
 * not just music vs theater — any narrow follow-up set maps to discipline “families”
 * so unrelated departments don’t rank highly from generic tag overlap.
 */

/** Course subject bucket for demotion (one primary family per prefix). */
export type OutsideCourseFamily =
  | "music"
  | "theater"
  | "dance"
  | "visual_arts"
  | "literature"
  | "history"
  | "philosophy"
  | "classics"
  | "architecture"
  | "communication"
  | "policy_government"
  | "business_economics"
  | "sociology"
  | "entrepreneurship"
  | "languages"
  | "global_area"
  | "cultural_studies"
  | "anthropology"
  | "biology"
  | "chemistry"
  | "physics_astronomy"
  | "environment"
  | "statistics_cs_math"
  | "neuroscience"
  | "psychology"
  | "health_nursing"
  | "education"
  | "kinesiology"
  | "religion"
  | "general";

const MUSIC_SUBJ = new Set(["MUSI", "MUEN", "MUPF", "MUBD"]);
const LIT_SUBJ = new Set(["ENGL", "ENCW", "ENAM", "ENWR", "CREO"]);
const HIST_SUBJ = new Set([
  "HIST",
  "HIUS",
  "HISA",
  "HIEU",
  "HILA",
  "HIME",
  "HIEA",
  "HIAF",
  "HSCI",
  "EURS",
  "JPTR"
]);
const LANG_SUBJ = new Set([
  "SPAN",
  "FREN",
  "GERM",
  "ITAL",
  "LATI",
  "CHIN",
  "JAPN",
  "KOR",
  "ARAB",
  "HIND",
  "HEBR",
  "PERS",
  "TURK",
  "URDU",
  "SWAH",
  "RUSS",
  "SLAV",
  "GREE",
  "SANS",
  "PORT",
  "ASL",
  "LING",
  "EALC",
  "LAST",
  "EAST",
  "CHTR",
  "KICH",
  "QUEC",
  "RUTR"
]);
const PHYS_ASTRO_SUBJ = new Set(["PHYS", "PHY", "ASTR", "NASC"]);
const ENV_SUBJ = new Set(["EVSC", "EVEC", "EVGE", "EVHY", "EVAT"]);
const POLICY_SUBJ = new Set([
  "PLIR",
  "PLCP",
  "PLAD",
  "POL",
  "PPOL",
  "PPL",
  "PLAP",
  "PLPT",
  "PLAC",
  "LPPS",
  "LPPL",
  "LPPA",
  "INST"
]);
const BUSINESS_SUBJ = new Set(["ECON", "GCCS", "GCOM", "GBUS", "EBUS"]);
const HEALTH_SUBJ = new Set(["NURS", "NUIP", "PHS", "GNUR", "PATH", "PHAR", "MED", "MICR", "CELL", "BIMS"]);

export function subjectToOutsideCourseFamily(subject: string): OutsideCourseFamily | null {
  const s = subject.trim().toUpperCase();
  if (!s) return null;

  if (MUSIC_SUBJ.has(s)) return "music";
  if (s === "DRAM") return "theater";
  if (s === "DANC") return "dance";
  if (["ARTS", "ARTH", "ARAH"].includes(s)) return "visual_arts";
  if (LIT_SUBJ.has(s)) return "literature";
  if (HIST_SUBJ.has(s)) return "history";
  if (s === "PHIL") return "philosophy";
  if (s === "CLAS") return "classics";
  if (s.startsWith("REL") || s === "JWST") return "religion";
  if (["ARCH", "SARC", "PLAN", "LAR"].includes(s)) return "architecture";
  if (s === "ARCY") return "anthropology";

  if (s === "COMM" || s === "MDST") return "communication";

  if (POLICY_SUBJ.has(s)) return "policy_government";
  if (s === "LAW") return "policy_government";

  if (s === "ENTP" || s === "ETP") return "entrepreneurship";
  if (BUSINESS_SUBJ.has(s)) return "business_economics";

  if (s === "SOC") return "sociology";

  if (s === "AMST" || s === "WGS" || s === "GSSJ" || s === "GSVS" || s === "MESA" || s === "MEST" || s === "AAS") {
    return "cultural_studies";
  }

  if (LANG_SUBJ.has(s)) return "languages";
  if (s === "ANTH" || s === "SAST" || s === "SAS") return "anthropology";

  if (s === "BIOL" || s === "BIOP" || s === "HBIO" || s === "BIOC") return "biology";
  if (s === "CHEM") return "chemistry";
  if (PHYS_ASTRO_SUBJ.has(s)) return "physics_astronomy";
  if (ENV_SUBJ.has(s)) return "environment";

  if (["MATH", "STAT", "GDS", "CS", "DS", "DH"].includes(s)) return "statistics_cs_math";

  if (s === "NESC" || s === "COGS") return "neuroscience";

  if (s === "PSYC") return "psychology";
  if (HEALTH_SUBJ.has(s)) return "health_nursing";

  if (["EDIS", "EDHS", "EDLF", "KLPA"].includes(s)) return "education";

  if (s === "KINE") return "kinesiology";

  return "general";
}

/** Broad onboarding tokens (lowercase) → course family. */
const BROAD_TO_FAMILY: Record<string, OutsideCourseFamily> = {
  communication: "communication",
  leadership: "communication",
  writing: "literature",
  journalism: "communication",
  business: "business_economics",
  economics: "business_economics",
  policy: "policy_government",
  law: "policy_government",
  sociology: "sociology",
  entrepreneurship: "entrepreneurship",
  arts: "visual_arts",
  music: "music",
  literature: "literature",
  history: "history",
  philosophy: "philosophy",
  classics: "classics",
  architecture: "architecture",
  languages: "languages",
  global: "global_area",
  culture: "cultural_studies",
  anthropology: "anthropology",
  biology: "biology",
  chemistry: "chemistry",
  physics: "physics_astronomy",
  environment: "environment",
  statistics: "statistics_cs_math",
  neuroscience: "neuroscience",
  psychology: "psychology",
  health: "health_nursing",
  education: "education",
  kinesiology: "kinesiology"
};

/** First segment of follow-up slug — must match `DETAIL_PREFIX_EXPANSION` keys in course-interest-match. */
const DETAIL_PREFIX_TO_FAMILY: Record<string, OutsideCourseFamily> = {
  comm: "communication",
  lead: "communication",
  write: "literature",
  jour: "communication",
  biz: "business_economics",
  econ: "business_economics",
  pol: "policy_government",
  law: "policy_government",
  soc: "sociology",
  ent: "entrepreneurship",
  art: "visual_arts",
  music: "music",
  lit: "literature",
  hist: "history",
  phil: "philosophy",
  clas: "classics",
  arch: "architecture",
  lang: "languages",
  glob: "global_area",
  cult: "cultural_studies",
  anth: "anthropology",
  bio: "biology",
  chem: "chemistry",
  phys: "physics_astronomy",
  env: "environment",
  stat: "statistics_cs_math",
  neuro: "neuroscience",
  psych: "psychology",
  health: "health_nursing",
  edu: "education",
  kine: "kinesiology"
};

export function impliedOutsideFamilies(
  outsideInterests: string[],
  outsideInterestDetails: string[]
): Set<OutsideCourseFamily> {
  const out = new Set<OutsideCourseFamily>();
  for (const raw of outsideInterests) {
    const k = raw.trim().toLowerCase();
    const f = BROAD_TO_FAMILY[k];
    if (f) out.add(f);
  }
  for (const raw of outsideInterestDetails) {
    const k = raw.trim().toLowerCase();
    if (!k || !k.includes("-")) continue;
    const pre = k.slice(0, k.indexOf("-"));
    const f = DETAIL_PREFIX_TO_FAMILY[pre];
    if (f) out.add(f);
  }
  return out;
}

const STEM_NEIGHBORS: Partial<Record<OutsideCourseFamily, OutsideCourseFamily[]>> = {
  biology: ["chemistry", "neuroscience", "environment", "health_nursing"],
  chemistry: ["biology", "physics_astronomy", "health_nursing"],
  physics_astronomy: ["chemistry", "statistics_cs_math"],
  neuroscience: ["biology", "psychology"],
  psychology: ["neuroscience", "health_nursing", "education"],
  environment: ["biology", "chemistry", "physics_astronomy"],
  statistics_cs_math: ["physics_astronomy", "business_economics"]
};

function familyNearUserCluster(courseFam: OutsideCourseFamily, implied: Set<OutsideCourseFamily>): boolean {
  for (const u of implied) {
    const n = STEM_NEIGHBORS[u];
    if (n?.includes(courseFam)) return true;
  }
  return false;
}

/**
 * Down-rank courses outside the student’s implied families when they used follow-ups.
 * Broad exploration (many areas) disables demotion.
 */
export function outsideFamilyAlignmentMultiplier(
  subjectPrefix: string,
  impliedFamilies: Set<OutsideCourseFamily>,
  detailCount: number,
  broadCount: number
): number {
  if (detailCount === 0) return 1;
  if (broadCount >= 5 || impliedFamilies.size >= 5) return 1;
  if (impliedFamilies.size === 0) return 1;

  const courseFam = subjectToOutsideCourseFamily(subjectPrefix);
  if (!courseFam || courseFam === "general") return 1;

  if (impliedFamilies.has(courseFam)) return 1;

  if (familyNearUserCluster(courseFam, impliedFamilies)) return 0.45;

  if (
    courseFam === "policy_government" &&
    (impliedFamilies.has("business_economics") ||
      impliedFamilies.has("sociology") ||
      impliedFamilies.has("entrepreneurship"))
  ) {
    return 0.65;
  }
  if (
    courseFam === "business_economics" &&
    (impliedFamilies.has("policy_government") || impliedFamilies.has("sociology"))
  ) {
    return 0.65;
  }
  if (courseFam === "business_economics" && impliedFamilies.has("entrepreneurship")) return 0.55;
  if (courseFam === "entrepreneurship" && impliedFamilies.has("business_economics")) return 0.55;

  if (courseFam === "cultural_studies" && impliedFamilies.has("global_area")) return 0.55;
  if (courseFam === "global_area" && impliedFamilies.has("cultural_studies")) return 0.55;

  if (courseFam === "theater" && impliedFamilies.has("music")) return 0.18;
  if (courseFam === "dance" && impliedFamilies.has("music")) return 0.32;
  if (courseFam === "music" && impliedFamilies.has("theater")) return 0.32;

  if (courseFam === "literature" && impliedFamilies.has("communication")) return 0.55;
  if (courseFam === "communication" && impliedFamilies.has("literature")) return 0.55;

  return 0.28;
}
