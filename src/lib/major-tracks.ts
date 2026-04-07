/**
 * Focus / pathway labels are aligned with public UVA program pages where possible.
 * `majorTrack` maps to `major_requirements.major` as `{Major} ({slug})` when the slug
 * is a configured option (see Supabase migration 004 for cloned rows). Undecided / empty
 * uses the base major name only.
 */

export type TrackOption = { value: string; label: string };

export type MajorTrackConfig = {
  sectionTitle: string;
  /** Shown under the dropdown */
  helpText?: string;
  options: TrackOption[];
};

export const CIVIL_TRACK_CODES = ["IS", "EWR", "SE", "CEM"] as const;

export const ENGINEERING_MAJORS = [
  "Aerospace Engineering",
  "Biomedical Engineering",
  "Chemical Engineering",
  "Civil Engineering",
  "Computer Engineering",
  "Computer Science (Engineering)",
  "Electrical Engineering",
  "Materials Science and Engineering",
  "Mechanical Engineering",
  "Systems Engineering"
] as const;

export type EngineeringMajor = (typeof ENGINEERING_MAJORS)[number];

const UNDECIDED: TrackOption = { value: "", label: "Undecided / Not Specified Yet" };

/** ECE optional focus paths (EE & CompE): https://engineering.virginia.edu/.../ece-electives-and-focus-paths */
const ECE_FOCUS_PATHS: TrackOption[] = [
  UNDECIDED,
  { value: "chips", label: "CHIPS (Circuits & Hardware Integration)" },
  {
    value: "electronic-photonic",
    label: "Electronic to Photonic Devices"
  },
  { value: "robotics-embedded", label: "Robotics & Embedded Systems" },
  { value: "machine-learning", label: "Machine Learning (ECE)" }
];

export const MAJOR_TRACK_CONFIG: Record<EngineeringMajor, MajorTrackConfig> = {
  "Aerospace Engineering": {
    sectionTitle: "Interest Area (Elective Planning)",
    helpText:
      "UVA Aerospace shares a department with Mechanical Engineering; use these topic pillars to guide technical electives.",
    options: [
      UNDECIDED,
      { value: "aerodynamics-fluids", label: "Aerodynamics & Fluid Systems" },
      { value: "structures", label: "Structures & Materials" },
      { value: "propulsion", label: "Propulsion" },
      { value: "controls-flight", label: "Controls & Flight Dynamics" }
    ]
  },
  "Biomedical Engineering": {
    sectionTitle: "BME Academic Pathway (Electives)",
    helpText: "Official pathways include Computational BME & data-focused work, and biotechnology / pharmaceutical engineering.",
    options: [
      UNDECIDED,
      { value: "computational-bme", label: "Computational BME & Data Science" },
      { value: "biotech-pharma", label: "Biotechnology & Pharmaceutical Engineering" }
    ]
  },
  "Chemical Engineering": {
    sectionTitle: "Curriculum Pathway (ChE)",
    helpText: "Department publishes broad-based, data analytics, biotechnology, and pre-med pathways among others.",
    options: [
      UNDECIDED,
      { value: "broad-based", label: "Broad-Based ChE" },
      { value: "data-analytics-che", label: "Data Analytics in ChE" },
      { value: "biotechnology-che", label: "Biotechnology Concentration" },
      { value: "pre-med-che", label: "Pre-Med / Health Preparation" }
    ]
  },
  "Civil Engineering": {
    sectionTitle: "Civil Engineering Track",
    helpText:
      "Catalog requirements are stored per track (IS, EWR, SE, CEM). Stay undecided if you have not chosen yet — required courses load after you pick a track.",
    options: [
      UNDECIDED,
      { value: "IS", label: "Infrastructure Systems (IS)" },
      { value: "EWR", label: "Environmental & Water Resources (EWR)" },
      { value: "SE", label: "Structural Engineering (SE)" },
      { value: "CEM", label: "Construction Engineering & Management (CEM)" }
    ]
  },
  "Computer Engineering": {
    sectionTitle: "ECE Focus Path (Optional)",
    helpText: "Same elective focus paths as Electrical Engineering (joint ECE department).",
    options: ECE_FOCUS_PATHS
  },
  "Computer Science (Engineering)": {
    sectionTitle: "CS Focus (Elective Planning)",
    helpText:
      "BS CS is a single degree; choices here are common elective directions — confirm with the CS advising guide.",
    options: [
      UNDECIDED,
      { value: "software", label: "Software & Applications" },
      { value: "systems", label: "Systems & Infrastructure" },
      { value: "ai-ml", label: "AI & Machine Learning" },
      { value: "theory", label: "Theory & Foundations" },
      { value: "security", label: "Security & Privacy" }
    ]
  },
  "Electrical Engineering": {
    sectionTitle: "ECE Focus Path (Optional)",
    helpText: "Focus paths are advisory groupings for ECE electives (not transcript majors).",
    options: ECE_FOCUS_PATHS
  },
  "Materials Science and Engineering": {
    sectionTitle: "MSE Emphasis (Elective Planning)",
    options: [
      UNDECIDED,
      { value: "electronic-materials", label: "Electronic / Functional Materials" },
      { value: "structural", label: "Structure, Processing & Mechanics" },
      { value: "energy-sustainability", label: "Energy & Sustainability Materials" }
    ]
  },
  "Mechanical Engineering": {
    sectionTitle: "ME Interest Area (Elective Planning)",
    options: [
      UNDECIDED,
      { value: "thermal-fluids", label: "Thermal & Fluid Sciences" },
      { value: "mechanics-materials", label: "Mechanics & Materials" },
      { value: "design-manufacturing", label: "Design & Manufacturing" },
      { value: "dynamics-controls", label: "Dynamics, Robotics & Controls" }
    ]
  },
  "Systems Engineering": {
    sectionTitle: "Systems Application Focus (Elective Planning)",
    helpText:
      "The BS Systems program highlights human–technology interaction, intelligent automation, and operations research / analytics.",
    options: [
      UNDECIDED,
      { value: "human-tech", label: "Human Technology Interaction" },
      { value: "intelligent-automation", label: "Information & Intelligent Automation" },
      { value: "operations-analytics", label: "Operations Research & Analytics" }
    ]
  }
};

export function getTrackConfig(major: string): MajorTrackConfig | null {
  return MAJOR_TRACK_CONFIG[major as EngineeringMajor] ?? null;
}

/** Default when user switches major */
export function defaultMajorTrackForMajor(major: string): string | undefined {
  const cfg = getTrackConfig(major);
  if (!cfg) return undefined;
  return cfg.options[0]?.value ?? "";
}

export function resolveMajorKeyForCatalog(major: string, majorTrack: string | undefined): string {
  const t = majorTrack?.trim() ?? "";
  if (!t) return major;

  if (major === "Civil Engineering") {
    if (CIVIL_TRACK_CODES.includes(t as (typeof CIVIL_TRACK_CODES)[number])) {
      return `Civil Engineering (${t})`;
    }
    return major;
  }

  const cfg = getTrackConfig(major);
  const allowed = cfg?.options.some((o) => o.value === t);
  if (allowed) {
    return `${major} (${t})`;
  }
  return major;
}

export function trackLabelForValue(major: string, value: string | undefined): string | null {
  if (value === undefined || value === "") return null;
  const cfg = getTrackConfig(major);
  const opt = cfg?.options.find((o) => o.value === value);
  return opt?.label ?? value;
}
