import { sampleCourses, sampleOpportunities, sampleRequirements } from "@/lib/data/sample";
import { withNormalizedProfessor } from "@/lib/course-professor";
import {
  compareCourseCodesByCatalog,
  effectiveMatchTags,
  effectiveOutsideMatchTags,
  expandInterestNeedles,
  sortCoursesByCatalog,
  subjectPrefixFromCode
} from "@/lib/course-interest-match";
import { impliedOutsideFamilies, outsideFamilyAlignmentMultiplier } from "@/lib/outside-discipline-alignment";
import {
  ENGINEERING_STUDY_ABROAD_SCORE_BONUS,
  isEngineeringFocusStudyAbroad,
  profileLooksEngineeringMajor
} from "@/lib/engineering-study-abroad-priority";
import { fallbackStudyAbroadPrograms } from "@/lib/study-abroad-catalog";
import type {
  Course,
  DashboardData,
  Opportunity,
  RecommendedItem,
  StudentProfileInput,
  StudyAbroadProgram
} from "@/types/domain";

const splitToTags = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[,\s]+/)
    .map((token) => token.trim())
    .filter(Boolean);

const studyAbroadSignalTags = (
  profile: Pick<StudentProfileInput, "studyAbroadGoal" | "studyAbroadInterests">
): string[] => {
  const fromGoal = splitToTags(profile.studyAbroadGoal);
  const chips = (profile.studyAbroadInterests ?? [])
    .map((t) => t.toLowerCase().trim())
    .filter(Boolean);
  return [...new Set([...fromGoal, ...chips])];
};

const scoreByOverlap = (needles: string[], haystack: string[]) => {
  const hay = new Set(haystack.map((tag) => tag.toLowerCase()));
  return needles.reduce((score, needle) => score + (hay.has(needle) ? 1 : 0), 0);
};

const reasonFromScore = (score: number, context: string) => {
  if (score >= 3) return `Strong match for your ${context}.`;
  if (score >= 1) return `Partial match for your ${context}.`;
  return `Included for broader exploration in your ${context}.`;
};

function rankStudyAbroadPrograms(
  items: StudyAbroadProgram[],
  studyAbroadTags: string[],
  profile: Pick<StudentProfileInput, "major">,
  context: string
): RecommendedItem<StudyAbroadProgram>[] {
  const needles = expandInterestNeedles(studyAbroadTags);
  const prioritizeEng = profileLooksEngineeringMajor(profile.major);
  return items
    .map((item) => {
      const hay = item.tags.map((t) => t.toLowerCase());
      let score = scoreByOverlap(needles, hay);
      if (prioritizeEng && isEngineeringFocusStudyAbroad(item)) {
        score += ENGINEERING_STUDY_ABROAD_SCORE_BONUS;
      }
      return {
        item,
        score,
        reason: reasonFromScore(score, context)
      };
    })
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
}

const rankItems = <T extends { tags: string[] }>(
  items: T[],
  targetTags: string[],
  context: string
): RecommendedItem<T>[] => {
  const needles = expandInterestNeedles(targetTags);
  return items
    .map((item) => {
      const hay = item.tags.map((t) => t.toLowerCase());
      const score = scoreByOverlap(needles, hay);
      return {
        item,
        score,
        reason: reasonFromScore(score, context)
      };
    })
    .sort((a, b) => b.score - a.score);
};

/** Rank by match score (for choosing the top N), then order those picks by catalog number for display. */
const rankCourses = (items: Course[], targetTags: string[], context: string): RecommendedItem<Course>[] => {
  const needles = expandInterestNeedles(targetTags);
  return items
    .map((item) => {
      const score = scoreByOverlap(needles, effectiveMatchTags(item));
      return {
        item,
        score,
        reason: reasonFromScore(score, context)
      };
    })
    .sort((a, b) => b.score - a.score);
};

const MUSIC_DEPT_SUBJECTS = new Set(["MUSI", "MUEN", "MUPF", "MUBD"]);

/** Non-engineering catalog: richer text + discipline alignment when follow-ups narrow intent. */
const rankOutsideEngineeringCourses = (
  items: Course[],
  targetTags: string[],
  context: string,
  profile: Pick<StudentProfileInput, "outsideInterests" | "outsideInterestDetails">
): RecommendedItem<Course>[] => {
  const needles = expandInterestNeedles(targetTags);
  const implied = impliedOutsideFamilies(profile.outsideInterests ?? [], profile.outsideInterestDetails ?? []);
  const detailCount = profile.outsideInterestDetails?.length ?? 0;
  const broadCount = profile.outsideInterests?.length ?? 0;

  return items
    .map((item) => {
      const hay = effectiveOutsideMatchTags(item);
      let score = scoreByOverlap(needles, hay);
      const sub = subjectPrefixFromCode(item.code);
      score = Math.floor(score * outsideFamilyAlignmentMultiplier(sub, implied, detailCount, broadCount));
      if (implied.has("music") && MUSIC_DEPT_SUBJECTS.has(sub)) {
        score += 4;
      }
      return {
        item,
        score,
        reason: reasonFromScore(score, context)
      };
    })
    .sort((a, b) => b.score - a.score);
};

const orderRecommendedCoursesByCatalog = (items: RecommendedItem<Course>[]): RecommendedItem<Course>[] =>
  [...items].sort((a, b) => compareCourseCodesByCatalog(a.item.code, b.item.code));

/** Cap for ranked engineering elective list (Engineering Courses tab). */
const RECOMMENDED_ENGINEERING_COURSE_LIMIT = 40;
/** Cap for ranked non-engineering list (Beyond Engineering tab). */
const RECOMMENDED_OUTSIDE_COURSE_LIMIT = 20;
/** Cap for UVA Education Abroad program suggestions (Study Abroad tab). */
const RECOMMENDED_STUDY_ABROAD_PROGRAM_LIMIT = 28;

export type DashboardSupplemental = {
  majorRequirements?: Course[];
  opportunities?: Opportunity[];
  /** From Supabase when available; replaces sample electives for engineering recommendations. */
  electiveCourses?: Course[];
  /** From Supabase when available; replaces sample rows for outside-engineering suggestions. */
  nonEngineeringCourses?: Course[];
  /** From `study_abroad_programs` when migrated; otherwise recommendations use bundled listing JSON. */
  studyAbroadPrograms?: StudyAbroadProgram[];
};

export const buildDashboardData = (
  profile: StudentProfileInput,
  supplemental?: DashboardSupplemental | null
): DashboardData => {
  let majorRequirements: Course[] = [];

  if (supplemental?.majorRequirements && supplemental.majorRequirements.length > 0) {
    majorRequirements = supplemental.majorRequirements;
  } else {
    const majorRequirementsCodes = sampleRequirements
      .filter((req) => req.major === profile.major)
      .map((req) => req.courseCode);

    majorRequirements = sampleCourses.filter((course) => {
      if (majorRequirementsCodes.length === 0) {
        return course.category === "required" && (course.majors.includes(profile.major) || course.majors.includes("All"));
      }
      return majorRequirementsCodes.includes(course.code);
    });
  }

  sortCoursesByCatalog(majorRequirements);
  majorRequirements = majorRequirements.map(withNormalizedProfessor);

  const goalTags = [
    ...splitToTags(profile.researchGoal),
    ...splitToTags(profile.internshipGoal),
    ...studyAbroadSignalTags(profile)
  ];
  const outsideSources = [...(profile.outsideInterests ?? []), ...(profile.outsideInterestDetails ?? [])];
  const outsideTags = Array.from(
    new Set(
      outsideSources.flatMap((item) => {
        const lower = item.toLowerCase().trim();
        return lower ? [lower, ...splitToTags(item)] : [];
      })
    )
  );

  const sampleElectivePool = sampleCourses.filter((c) => c.category === "elective");

  let electivePool =
    supplemental?.electiveCourses && supplemental.electiveCourses.length > 0
      ? supplemental.electiveCourses
      : sampleElectivePool;
  electivePool = electivePool.map(withNormalizedProfessor);

  let nonEngineering =
    supplemental?.nonEngineeringCourses && supplemental.nonEngineeringCourses.length > 0
      ? supplemental.nonEngineeringCourses
      : sampleCourses.filter((course) => course.category === "non_engineering");
  nonEngineering = nonEngineering.map(withNormalizedProfessor);

  const oppPool =
    supplemental?.opportunities && supplemental.opportunities.length > 0
      ? supplemental.opportunities
      : sampleOpportunities;
  const opportunitiesByType = (type: Opportunity["type"]) => oppPool.filter((opp) => opp.type === type);

  const studyAbroadProgramPool =
    supplemental?.studyAbroadPrograms && supplemental.studyAbroadPrograms.length > 0
      ? supplemental.studyAbroadPrograms
      : fallbackStudyAbroadPrograms;

  const studyAbroadTags = studyAbroadSignalTags(profile);

  return {
    majorRequirements,
    recommendedCourses: orderRecommendedCoursesByCatalog(
      rankCourses(electivePool, goalTags, "Engineering Goals").slice(0, RECOMMENDED_ENGINEERING_COURSE_LIMIT)
    ),
    researchMatches: rankItems<Opportunity>(
      opportunitiesByType("research"),
      goalTags,
      "Research Interests"
    ).slice(0, 6),
    internshipMatches: rankItems<Opportunity>(
      opportunitiesByType("internship"),
      goalTags,
      "Internship Goals"
    ).slice(0, 6),
    studyAbroadMatches: rankItems<Opportunity>(
      opportunitiesByType("study_abroad"),
      goalTags,
      "Study Abroad Goals"
    ).slice(0, 6),
    studyAbroadProgramMatches: rankStudyAbroadPrograms(
      studyAbroadProgramPool,
      studyAbroadTags,
      profile,
      "Study Abroad Goals"
    ).slice(0, RECOMMENDED_STUDY_ABROAD_PROGRAM_LIMIT),
    outsideEngineeringMatches: orderRecommendedCoursesByCatalog(
      rankOutsideEngineeringCourses(nonEngineering, outsideTags, "Outside Engineering Interests", profile).slice(
        0,
        RECOMMENDED_OUTSIDE_COURSE_LIMIT
      )
    )
  };
};
