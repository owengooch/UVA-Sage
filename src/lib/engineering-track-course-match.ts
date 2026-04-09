import { CIVIL_TRACK_CODES, type EngineeringMajor, ENGINEERING_MAJORS } from "@/lib/major-tracks";
import type { Course, StudentProfileInput } from "@/types/domain";

const NORM = (c: string) => c.trim().replace(/\s+/g, " ").toLowerCase();

type CivilTrackCode = (typeof CIVIL_TRACK_CODES)[number];

function isEngineeringMajor(major: string): major is EngineeringMajor {
  return (ENGINEERING_MAJORS as readonly string[]).includes(major);
}

function civilCourseMatchesTrack(course: Course, track: string): boolean {
  const tr = track.trim().toUpperCase() as CivilTrackCode | string;
  const f = (course.electiveFulfillments ?? []).map((x) => x.toLowerCase());
  const has = (sub: string) => f.some((x) => x.includes(sub));
  if (tr === "EWR") return has("ewr");
  if (tr === "CEM") return has("cem");
  if (tr === "SE") return has("structural") || has("se_elective");
  if (tr === "IS") {
    if (has("ewr") || has("cem") || has("structural")) return false;
    return has("technical_elective") || f.includes("ce:ce_elective");
  }
  return false;
}

/** ECE focus paths (EE + CpE). */
const ECE_FOCUS_KEYWORDS: Record<string, string[]> = {
  chips: ["circuit", "vlsi", "hardware", "integrated", "microelectron", "logic design", "digital design"],
  "electronic-photonic": [
    "photonic",
    "photovolta",
    "semiconductor",
    "device",
    "optoelectron",
    "electromagnetic wave"
  ],
  "robotics-embedded": ["robot", "embedded", "mechatron", "real-time", "autonomous", "control system"],
  "machine-learning": ["machine learning", "neural", "deep learn", "inference", "pattern recognition"]
};

const ADVISORY_TRACK_KEYWORDS: Partial<Record<EngineeringMajor, Record<string, string[]>>> = {
  "Aerospace Engineering": {
    "aerodynamics-fluids": ["fluid", "aerodynam", "compressible", "turbulen", "aeroacoust"],
    structures: ["structur", "composite", "fatigue", "solid mechanic"],
    propulsion: ["propulsion", "combustion", "rocket", "turbine"],
    "controls-flight": ["flight", "aircraft", "guidance", "navigation", "flight mechanic"]
  },
  "Biomedical Engineering": {
    "computational-bme": [
      "computational",
      "simulation",
      "modeling",
      "image process",
      "machine learning",
      "data science"
    ],
    "biotech-pharma": ["pharmaceutical", "tissue", "biomaterial", "biotech", "cell culture", "drug deliv"]
  },
  "Chemical Engineering": {
    "data-analytics-che": ["data", "analytic", "statistic", "machine learning", "database", "optimization"],
    "biotechnology-che": ["biotech", "cell", "molecular bio", "ferment", "pharmaceutical process"],
    "pre-med-che": ["physiology", "anatomy", "medical", "neuro", "immun"]
  },
  "Computer Engineering": ECE_FOCUS_KEYWORDS,
  "Electrical Engineering": ECE_FOCUS_KEYWORDS,
  "Computer Science (Engineering)": {
    software: ["software", "web", "application", "mobile", "interface", "human-computer", "programming language"],
    systems: [
      "operating system",
      "distributed",
      "network",
      "compiler",
      "computer architecture",
      "parallel"
    ],
    "ai-ml": ["machine learning", "artificial intelligence", "neural", "deep learn", "nlp", "computer vision"],
    theory: ["algorithm", "complexity", "graph theory", "formal", "cryptograph"],
    security: ["security", "crypto", "privacy", "vulnerab", "malware"]
  },
  "Materials Science and Engineering": {
    "electronic-materials": ["semiconductor", "electronic material", "thin film", "quantum material"],
    structural: ["mechanic", "structur", "alloy", "processing", "microstructur"],
    "energy-sustainability": ["energy", "solar", "battery", "sustainab", "photovolta"]
  },
  "Mechanical Engineering": {
    "thermal-fluids": ["thermal", "fluid", "heat transfer", "combustion", "aerodynam"],
    "mechanics-materials": ["solid mechanic", "material", "fracture", "composite", "finite element"],
    "design-manufacturing": ["design", "manufactur", "cad", "prototype", "product dev"],
    "dynamics-controls": ["dynamic", "control", "vibrat", "robot", "mechatron"]
  },
  "Systems Engineering": {
    "human-tech": ["human", "interface", "hci", "usab", "cognitive", "human factor"],
    "intelligent-automation": ["automation", "intelligent", "data mining", "sensor", "iot"],
    "operations-analytics": ["optimization", "stochastic", "operation research", "queue", "decision analy"]
  }
};

function courseHaystack(course: Course): string {
  const parts = [
    course.code,
    course.title,
    course.description,
    ...(course.tags ?? []),
    ...(course.electiveFulfillments ?? []).map((t) => t.replace(/:/g, " "))
  ];
  return parts.join(" ").toLowerCase();
}

function advisoryKeywordsFor(major: EngineeringMajor, track: string): string[] | null {
  const t = track.trim();
  if (!t) return null;
  const byMajor = ADVISORY_TRACK_KEYWORDS[major];
  if (!byMajor) return null;
  const words = byMajor[t];
  if (!words?.length) return null;
  return words;
}

/** Track + major pair is configured for subgrouping (non-empty advisory keywords or Civil catalog track). */
export function trackSubgroupingSupported(
  major: string,
  majorTrack: string | undefined
): boolean {
  const track = majorTrack?.trim() ?? "";
  if (!track) return false;
  if (major === "Civil Engineering" && (CIVIL_TRACK_CODES as readonly string[]).includes(track)) {
    return true;
  }
  if (!isEngineeringMajor(major)) return false;
  const kw = advisoryKeywordsFor(major, track);
  return kw !== null && kw.length > 0;
}

/**
 * Whether a course is a strong match for the student’s declared track/focus (Civil catalog tracks or advisory pathways).
 */
export function courseAlignsWithStudentTrack(
  course: Course,
  profile: Pick<StudentProfileInput, "major" | "majorTrack">
): boolean {
  const major = profile.major?.trim() ?? "";
  const track = profile.majorTrack?.trim() ?? "";
  if (!major || !track) return false;

  if (major === "Civil Engineering" && (CIVIL_TRACK_CODES as readonly string[]).includes(track)) {
    return civilCourseMatchesTrack(course, track);
  }

  if (!isEngineeringMajor(major)) return false;
  const keywords = advisoryKeywordsFor(major, track);
  if (!keywords?.length) return false;

  const hay = courseHaystack(course);
  return keywords.some((k) => hay.includes(NORM(k)));
}
