export type OpportunityType = "research" | "internship" | "study_abroad" | "co_curricular";

export interface StudentProfileInput {
  /** Captured on first onboarding; used with quick login. Not sent to Supabase (auth user email is canonical). */
  uvaEmail?: string;
  /** Set when the user finishes onboarding once (local); Supabase `saved` also implies completion. */
  onboardingCompleted?: boolean;
  major: string;
  /**
   * Focus / pathway / track slug. When set, `major_requirements` uses `{major} ({slug})` (see migration 004).
   * Empty means the base major only.
   */
  majorTrack?: string;
  graduationYear: string;
  researchGoal: string;
  internshipGoal: string;
  /** Legacy free-text goal; merged with `studyAbroadInterests` for matching. */
  studyAbroadGoal: string;
  /** Chip selections from onboarding (ISO catalog tag tokens). */
  studyAbroadInterests?: string[];
  outsideInterests: string[];
  /** Narrower follow-up choices tied to broad outside interests; used for non-engineering course matching. */
  outsideInterestDetails?: string[];
  /** Course codes marked complete; kept across major/track changes. Shown per-plan on the Required courses tab. */
  completedCourseCodes?: string[];
}

export interface Course {
  code: string;
  title: string;
  credits: number;
  /** Present only when the catalog has a specific instructor name (not TBD/Staff/etc.). */
  professor?: string;
  description: string;
  majors: string[];
  tags: string[];
  category: "required" | "elective" | "non_engineering";
  /** Set when loaded from Supabase major_requirements */
  requirementType?: string;
}

export interface MajorRequirement {
  major: string;
  courseCode: string;
  requirementType: "core" | "technical_elective" | "science" | "math";
}

export interface Opportunity {
  type: OpportunityType;
  title: string;
  description: string;
  department: string;
  eligibility: string;
  tags: string[];
  link: string;
}

/** Row from `study_abroad_programs` or bundled listing snapshot (UVA Education Abroad). */
export interface StudyAbroadProgram {
  id: string;
  title: string;
  detailUrl: string;
  termBucket: string;
  regionGroup: string | null;
  locationSummary: string;
  termsOfferedText: string;
  description: string;
  coursesOffered: string[];
  subjectAreas: string[];
  tags: string[];
  creditNote: string;
  walkerScholarship: boolean;
  transferCredit: boolean;
  combinationCredit: boolean;
}

export interface RecommendedItem<T> {
  item: T;
  score: number;
  reason: string;
}

export interface DashboardData {
  majorRequirements: Course[];
  recommendedCourses: RecommendedItem<Course>[];
  researchMatches: RecommendedItem<Opportunity>[];
  internshipMatches: RecommendedItem<Opportunity>[];
  /** @deprecated Prefer studyAbroadProgramMatches (ISO catalog). */
  studyAbroadMatches: RecommendedItem<Opportunity>[];
  studyAbroadProgramMatches: RecommendedItem<StudyAbroadProgram>[];
  outsideEngineeringMatches: RecommendedItem<Course>[];
}
