import type { Course } from "@/types/domain";

/** Subject prefix from catalog code (e.g. "ENGL 2500" → "ENGL"). */
export function subjectPrefixFromCode(code: string): string {
  const t = code.trim().split(/\s+/)[0] ?? "";
  return t.toUpperCase();
}

/** First digit run in a catalog code (e.g. "MAE 2100" → 2100, "ENGR 3200" → 3200). */
export function catalogNumberFromCode(code: string): number {
  const m = code.trim().match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

/** Sort by catalog number ascending, then subject, then full code — so MAE 2100 orders before ENGR 3200. */
export function compareCourseCodesByCatalog(aCode: string, bCode: string): number {
  const na = catalogNumberFromCode(aCode);
  const nb = catalogNumberFromCode(bCode);
  if (na !== nb) return na - nb;
  const c = subjectPrefixFromCode(aCode).localeCompare(subjectPrefixFromCode(bCode));
  if (c !== 0) return c;
  return aCode.localeCompare(bCode);
}

/** In-place: all course lists use catalog number as the primary sort key. */
export function sortCoursesByCatalog(courses: Course[]): void {
  courses.sort((a, b) => compareCourseCodesByCatalog(a.code, b.code));
}

/**
 * Maps UVA-style subject codes to interest tokens used in onboarding / goals.
 * Keys must be uppercase subject prefixes.
 */
const SUBJECT_PREFIX_TERMS: Record<string, string[]> = {
  AAS: ["african-american studies", "aas"],
  AMST: ["american studies"],
  ANTH: ["anthropology"],
  ARTH: ["arts", "architecture"],
  ARTS: ["arts"],
  ASTR: ["physics", "astronomy"],
  BIOL: ["biology"],
  CHEM: ["chemistry"],
  CHIN: ["languages"],
  CLAS: ["classics"],
  COMM: ["communication", "leadership"],
  CS: ["systems", "software", "computer science"],
  /** Avoid tagging dance as music so music-only profiles don’t rank DANC like MUSI. */
  DANC: ["dance", "arts", "movement", "performance"],
  /** Theater / drama — omit "music" so music-only interests don’t match every DRAM course. */
  DRAM: ["drama", "theater", "theatre", "acting", "arts"],
  ECON: ["economics", "business"],
  EDHS: ["education", "health"],
  EDIS: ["education"],
  ENGL: ["literature", "english", "writing"],
  ENCW: ["writing", "literature"],
  ENAM: ["literature", "american studies"],
  ENEC: ["environment", "policy"],
  EURO: ["global", "culture"],
  FREN: ["languages"],
  GERM: ["languages"],
  ITAL: ["languages"],
  HIST: ["history"],
  JWST: ["jewish studies", "history"],
  KINE: ["kinesiology", "health"],
  LATI: ["languages"],
  LING: ["languages", "linguistics"],
  MATH: ["statistics", "math"],
  STAT: ["statistics", "data literacy"],
  MDST: ["media", "culture"],
  MUSI: ["music", "arts"],
  NUIP: ["nursing", "health"],
  NURS: ["nursing", "health"],
  PHIL: ["philosophy", "ethics", "law"],
  PLAD: ["policy", "government"],
  PLCP: ["policy", "government"],
  PLIR: ["policy", "government", "global"],
  POL: ["policy", "government"],
  PPL: ["policy", "law", "ethics"],
  PPOL: ["policy", "government"],
  PSYC: ["psychology"],
  RELG: ["religion", "culture"],
  RELI: ["religion", "culture"],
  SLAV: ["languages", "literature"],
  SOC: ["sociology", "society"],
  SPAN: ["languages", "spanish"],
  PORT: ["languages"],
  WGS: ["women", "gender", "culture"],
  EGMT: ["engagement", "humanities"],
  ELA: ["humanities"],
  ENTP: ["entrepreneurship", "business"],
  ARCH: ["architecture", "design"],
  PLAN: ["architecture", "policy"],
  LAR: ["architecture", "environment"],
  EVSC: ["environment", "biology"],
  GDS: ["data literacy", "statistics"],
  PHS: ["public health", "health"],
  PSTS: ["science", "society"],
  USEM: ["humanities"],
  SAS: ["anthropology", "culture"],
  SAST: ["anthropology", "culture"]
};

/** Hoos’ List / DB group labels (lowercase keys) → interest tokens. */
const GROUP_LABEL_TERMS: Record<string, string[]> = {
  english: ["english", "literature", "writing"],
  economics: ["economics", "business"],
  history: ["history"],
  psychology: ["psychology"],
  philosophy: ["philosophy", "ethics"],
  biology: ["biology"],
  chemistry: ["chemistry"],
  physics: ["physics", "astronomy"],
  "computer science": ["systems", "software"],
  mathematics: ["statistics", "math"],
  statistics: ["statistics", "data literacy"],
  sociology: ["sociology", "society"],
  anthropology: ["anthropology"],
  "political science": ["policy", "government"],
  politics: ["policy", "government"],
  art: ["arts"],
  music: ["music", "arts"],
  drama: ["drama", "theater", "arts"],
  classics: ["classics", "history"],
  religion: ["religion", "culture"],
  "environmental sciences": ["environment"],
  linguistics: ["languages", "linguistics"],
  comm: ["communication", "leadership"],
  journalism: ["journalism", "communication"],
  education: ["education"],
  nursing: ["nursing", "health"],
  law: ["law", "policy"],
  span: ["languages"],
  french: ["languages"],
  german: ["languages"],
  "global studies": ["global", "culture"],
  "data science": ["data literacy", "statistics"],
  creativewriting: ["writing", "literature"],
  datascience: ["data literacy", "statistics"],
  cogsci: ["psychology", "neuroscience"],
  publicpolicy: ["policy", "government"],
  biomed: ["biology", "health"]
};

/** Extra tokens to try when the student picked an onboarding interest value. */
const INTEREST_SYNONYMS: Record<string, string[]> = {
  literature: ["literature", "english", "engl", "writing", "encw"],
  writing: ["writing", "english", "literature", "composition"],
  communication: ["communication", "comm", "rhetoric"],
  leadership: ["leadership", "organizations", "comm"],
  journalism: ["journalism", "media", "comm"],
  business: ["business", "economics", "econ", "commerce", "entrepreneurship"],
  economics: ["economics", "econ", "business"],
  policy: ["policy", "government", "politics", "plir", "ppol"],
  law: ["law", "ethics", "philosophy", "ppl"],
  sociology: ["sociology", "soc", "society", "anthropology"],
  entrepreneurship: ["entrepreneurship", "business", "commerce"],
  arts: ["arts", "art", "arth", "visual"],
  music: ["music", "mus", "musical"],
  history: ["history", "hist"],
  philosophy: ["philosophy", "phil", "ethics"],
  classics: ["classics", "cl"],
  architecture: ["architecture", "arch", "design", "plan"],
  languages: ["languages", "span", "fren", "germ", "ling"],
  global: ["global", "international", "area", "plir"],
  culture: ["culture", "anthropology", "religion"],
  anthropology: ["anthropology", "anth", "archaeology"],
  biology: ["biology", "biol", "life sciences"],
  chemistry: ["chemistry", "chem"],
  physics: ["physics", "phys", "astronomy", "astr"],
  environment: ["environment", "evsc", "sustainability"],
  statistics: ["statistics", "stat", "math", "data"],
  neuroscience: ["neuroscience", "psychology", "biology"],
  psychology: ["psychology", "psyc"],
  health: ["health", "nursing", "public health", "phs"],
  education: ["education", "edis", "edhs"],
  kinesiology: ["kinesiology", "kine", "movement"],
  /** ISO / Education Abroad tags use `january` for J-term; students often say “winter”. */
  january: ["winter"],
  winter: ["january"]
};

/**
 * First segment of hyphenated detail tokens from onboarding (e.g. music-vocal-choral → music).
 * Expands to coarse tags for course matching without listing every detail variant.
 */
const DETAIL_PREFIX_EXPANSION: Record<string, string[]> = {
  comm: ["communication", "rhetoric", "comm"],
  lead: ["leadership", "organizations", "management"],
  write: ["writing", "english", "literature", "composition"],
  jour: ["journalism", "media", "communication"],
  biz: ["business", "commerce", "economics"],
  econ: ["economics", "econ", "business"],
  pol: ["policy", "government", "politics"],
  law: ["law", "ethics", "policy", "ppl"],
  soc: ["sociology", "society", "anthropology"],
  ent: ["entrepreneurship", "business", "commerce"],
  art: ["arts", "art", "arth", "visual"],
  /** Avoid performance/drama here — those words appear constantly in theater listings. */
  music: ["music", "mus", "musical"],
  lit: ["literature", "english", "writing", "encw"],
  hist: ["history", "hist"],
  phil: ["philosophy", "phil", "ethics"],
  clas: ["classics", "history", "literature", "cl"],
  arch: ["architecture", "arch", "design", "plan"],
  lang: ["languages", "linguistics", "span", "fren", "germ"],
  glob: ["global", "international", "culture", "plir"],
  cult: ["culture", "anthropology", "society", "religion"],
  anth: ["anthropology", "anth", "archaeology"],
  bio: ["biology", "biol", "life sciences"],
  chem: ["chemistry", "chem"],
  phys: ["physics", "phys", "astronomy", "astr"],
  env: ["environment", "evsc", "sustainability", "ecology"],
  stat: ["statistics", "stat", "math", "data literacy"],
  neuro: ["neuroscience", "psychology", "biology"],
  psych: ["psychology", "psyc", "health"],
  health: ["health", "public health", "nursing", "phs"],
  edu: ["education", "edis", "edhs"],
  kine: ["kinesiology", "kine", "movement", "health"]
};

export function expandInterestNeedles(needles: string[]): string[] {
  const out = new Set<string>();
  for (const n of needles) {
    const key = n.toLowerCase().trim();
    if (!key) continue;
    out.add(key);
    const syn = INTEREST_SYNONYMS[key];
    if (syn) for (const s of syn) out.add(s.toLowerCase());
    const dash = key.indexOf("-");
    if (dash !== -1) {
      const pre = key.slice(0, dash);
      const coarse = DETAIL_PREFIX_EXPANSION[pre];
      if (coarse) for (const s of coarse) out.add(s.toLowerCase());
      /** Tail segments: music-jazz-pop-contemporary → jazz, pop, contemporary (specific follow-ups). */
      const segments = key.split("-");
      for (let i = 1; i < segments.length; i++) {
        const seg = segments[i].trim().toLowerCase();
        if (seg.length > 2) out.add(seg);
      }
    }
  }
  return [...out];
}

const OUTSIDE_MATCH_STOPWORDS = new Set([
  "about",
  "after",
  "also",
  "been",
  "being",
  "before",
  "between",
  "both",
  "course",
  "courses",
  "credit",
  "credits",
  "during",
  "each",
  "from",
  "have",
  "including",
  "into",
  "introduction",
  "lecture",
  "many",
  "might",
  "more",
  "most",
  "must",
  "only",
  "other",
  "over",
  "prerequisite",
  "required",
  "semester",
  "shall",
  "should",
  "some",
  "students",
  "student",
  "study",
  "studies",
  "survey",
  "such",
  "than",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "this",
  "those",
  "through",
  "topics",
  "under",
  "upon",
  "various",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "will",
  "with",
  "within",
  "without",
  "would",
  "could",
  "your",
  "they",
  "advanced"
]);

const HOOS_TAG_NOISE = new Set(["and", "the", "for", "are", "but", "not", "you", "our", "one"]);

/** Split Hoos' List style group keys (e.g. ArtisticInterpretiveAndPhilosophicalInquiry) into words. */
function wordsFromHoosListGroupTag(tag: string): string[] {
  const t = tag.trim();
  if (!t) return [];
  if (t.length <= 6 && t === t.toUpperCase()) {
    return [];
  }
  const spaced = t
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  return spaced
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !HOOS_TAG_NOISE.has(w));
}

/** Richer haystack for Beyond Engineering: descriptions + Hoos group keywords + more title tokens. */
export function effectiveOutsideMatchTags(course: Course): string[] {
  const out = new Set<string>(effectiveMatchTags(course));
  for (const t of course.tags ?? []) {
    for (const w of wordsFromHoosListGroupTag(t)) {
      out.add(w);
    }
  }
  const titleWords = course.title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  for (const w of titleWords.slice(0, 24)) {
    out.add(w);
  }
  const descWords = course.description
    .toLowerCase()
    .replace(/&#\d+;/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 4 && !OUTSIDE_MATCH_STOPWORDS.has(w));
  for (const w of descWords.slice(0, 55)) {
    out.add(w);
  }
  return [...out];
}

/** All lowercase tokens used to score a course against profile interests. */
export function effectiveMatchTags(course: Course): string[] {
  const out = new Set<string>();
  for (const t of course.tags ?? []) {
    const low = t.toLowerCase().trim();
    if (!low) continue;
    out.add(low);
    const g = GROUP_LABEL_TERMS[low];
    if (g) for (const x of g) out.add(x);
  }
  const sub = subjectPrefixFromCode(course.code);
  out.add(sub.toLowerCase());
  const subTerms = SUBJECT_PREFIX_TERMS[sub];
  if (subTerms) for (const x of subTerms) out.add(x);

  const titleWords = course.title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  for (const w of titleWords.slice(0, 8)) out.add(w);

  return [...out];
}
