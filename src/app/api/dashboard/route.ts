import { NextResponse } from "next/server";
import { professorFromDb } from "@/lib/course-professor";
import { resolveElectiveFulfillmentsForCourse } from "@/lib/elective-fulfillment-tags";
import { resolveMajorKeyForCatalog } from "@/lib/major-tracks";
import { sortCoursesByCatalog, subjectPrefixFromCode } from "@/lib/course-interest-match";
import { LIKELY_HSS_SUBJECTS } from "@/lib/engineering-elective-pool";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { Course, Opportunity, StudyAbroadProgram } from "@/types/domain";

export const dynamic = "force-dynamic";

/** Fetch psych/soc seed rows by code if missing from paged load (conflicts, truncation). */
const BEYOND_ENSURE_CODES = ["PSYC 2150", "SOC 1010"] as const;

const BEYOND_ELECTIVE_SUBJECTS_FOR_MERGE = new Set<string>([
  ...LIKELY_HSS_SUBJECTS,
  "SOC",
  "COGS",
  "NESC"
]);

const normCourseCode = (code: string) => code.trim().replace(/\s+/g, " ");

type DbCourse = {
  code: string;
  title: string;
  credits: number | string;
  professor: string | null;
  description: string | null;
  majors: string[] | null;
  tags: string[] | null;
  category: Course["category"];
  elective_fulfillments?: string[] | null;
};

function mapCourse(row: DbCourse, requirementType?: string): Course {
  const credits = typeof row.credits === "string" ? parseFloat(row.credits) : row.credits;
  const professor = professorFromDb(row.professor);
  const electiveFulfillments = resolveElectiveFulfillmentsForCourse(row.code, row.elective_fulfillments);
  return {
    code: row.code,
    title: row.title,
    credits,
    ...(professor !== undefined ? { professor } : {}),
    description: row.description ?? row.title,
    majors: row.majors ?? [],
    tags: row.tags ?? [],
    category: row.category,
    ...(electiveFulfillments.length > 0 ? { electiveFulfillments } : {}),
    ...(requirementType ? { requirementType } : {})
  };
}

/**
 * PostgREST often caps each response (~1k rows). Page the whole catalog so Beyond Engineering
 * is not a random subset of `non_engineering` / `elective`.
 */
async function fetchAllCoursesForCategory(
  supabase: ReturnType<typeof createPublicSupabaseClient>,
  category: Course["category"]
): Promise<DbCourse[]> {
  const pageSize = 1000;
  const maxRows = 100_000;
  const rows: DbCourse[] = [];
  for (let from = 0; from < maxRows; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("category", category)
      .order("code", { ascending: true })
      .range(from, to);
    if (error) break;
    if (!data?.length) break;
    rows.push(...(data as DbCourse[]));
    if (data.length < pageSize) break;
  }
  return rows;
}

async function appendCoursesByCodeIfMissing(
  supabase: ReturnType<typeof createPublicSupabaseClient>,
  nonEngineeringCourses: Course[],
  electiveCourses: Course[],
  codes: readonly string[]
): Promise<void> {
  const present = new Set(
    [...nonEngineeringCourses, ...electiveCourses].map((c) => normCourseCode(c.code))
  );
  const need = codes.filter((c) => !present.has(normCourseCode(c)));
  if (need.length === 0) return;
  const { data, error } = await supabase.from("courses").select("*").in("code", [...need]);
  if (error || !data?.length) return;
  for (const row of data as DbCourse[]) {
    const c = mapCourse(row);
    const sub = subjectPrefixFromCode(c.code);
    const isEnsured = need.some((x) => normCourseCode(x) === normCourseCode(c.code));
    if (c.category === "non_engineering") {
      nonEngineeringCourses.push(c);
    } else if (c.category === "elective" && BEYOND_ELECTIVE_SUBJECTS_FOR_MERGE.has(sub)) {
      electiveCourses.push(c);
    } else if (isEnsured) {
      nonEngineeringCourses.push(c);
    }
  }
}

function mapOpportunity(row: Record<string, unknown>): Opportunity {
  return {
    type: row.type as Opportunity["type"],
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    department: String(row.department ?? ""),
    eligibility: String(row.eligibility ?? ""),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    link: String(row.link ?? "")
  };
}

function mapStudyAbroadProgram(row: Record<string, unknown>): StudyAbroadProgram {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    detailUrl: String(row.detail_url ?? ""),
    termBucket: String(row.term_bucket ?? ""),
    regionGroup: row.region_group != null ? String(row.region_group) : null,
    locationSummary: String(row.location_summary ?? ""),
    termsOfferedText: String(row.terms_offered_text ?? ""),
    description: String(row.description ?? ""),
    coursesOffered: Array.isArray(row.courses_offered) ? (row.courses_offered as string[]) : [],
    subjectAreas: Array.isArray(row.subject_areas) ? (row.subject_areas as string[]) : [],
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    creditNote: String(row.credit_note ?? ""),
    walkerScholarship: Boolean(row.walker_scholarship),
    transferCredit: Boolean(row.transfer_credit),
    combinationCredit: Boolean(row.combination_credit)
  };
}

async function loadStudyAbroadPrograms(
  supabase: ReturnType<typeof createPublicSupabaseClient>
): Promise<StudyAbroadProgram[]> {
  const { data, error } = await supabase
    .from("study_abroad_programs")
    .select("*")
    .order("title", { ascending: true })
    .limit(500);
  if (error || !data?.length) return [];
  return (data as Record<string, unknown>[]).map(mapStudyAbroadProgram);
}

async function loadRecommendationCatalog(
  supabase: ReturnType<typeof createPublicSupabaseClient>
): Promise<{ electiveCourses: Course[]; nonEngineeringCourses: Course[] }> {
  const [neRows, elRows] = await Promise.all([
    fetchAllCoursesForCategory(supabase, "non_engineering"),
    fetchAllCoursesForCategory(supabase, "elective")
  ]);

  const nonEngineeringCourses = neRows.map((c) => mapCourse(c));
  const electiveCourses = elRows.map((c) => mapCourse(c));

  await appendCoursesByCodeIfMissing(supabase, nonEngineeringCourses, electiveCourses, BEYOND_ENSURE_CODES);

  return { electiveCourses, nonEngineeringCourses };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const major = url.searchParams.get("major");
  const majorTrack = url.searchParams.get("majorTrack") ?? url.searchParams.get("ceTrack") ?? undefined;

  if (!major) {
    return NextResponse.json({ error: "Query parameter major is required." }, { status: 400 });
  }

  const majorKey = resolveMajorKeyForCatalog(major, majorTrack);

  const supabase = createPublicSupabaseClient();

  const { electiveCourses, nonEngineeringCourses } = await loadRecommendationCatalog(supabase);
  const studyAbroadPrograms = await loadStudyAbroadPrograms(supabase);

  const { data: reqRows, error: reqErr } = await supabase
    .from("major_requirements")
    .select("course_code, requirement_type")
    .eq("major", majorKey);

  if (reqErr) {
    return NextResponse.json(
      {
        error: reqErr.message,
        majorRequirements: [],
        opportunities: [],
        electiveCourses,
        nonEngineeringCourses,
        studyAbroadPrograms
      },
      { status: 500 }
    );
  }

  let rows = reqRows ?? [];

  if (rows.length === 0 && major === "Civil Engineering" && !majorTrack?.trim()) {
    const { data: oppRowsCivil, error: oppErrCivil } = await supabase.from("opportunities").select("*").limit(40);
    let opportunities: Opportunity[] = [];
    if (!oppErrCivil && oppRowsCivil?.length) {
      opportunities = oppRowsCivil.map((row) => mapOpportunity(row as Record<string, unknown>));
    }
    return NextResponse.json(
      {
        error: null,
        majorRequirements: [],
        opportunities,
        electiveCourses,
        nonEngineeringCourses,
        studyAbroadPrograms,
        hint: "Select a Civil Engineering track (IS, EWR, SE, or CEM) in onboarding to load degree requirements."
      },
      { status: 200 }
    );
  }

  const codeOrder = [...new Set(rows.map((r) => r.course_code as string))];
  const typeByCode = new Map(rows.map((r) => [r.course_code as string, r.requirement_type as string]));

  const { data: courseRows, error: courseErr } = await supabase.from("courses").select("*").in("code", codeOrder);

  if (courseErr) {
    return NextResponse.json(
      {
        error: courseErr.message,
        majorRequirements: [],
        opportunities: [],
        electiveCourses,
        nonEngineeringCourses,
        studyAbroadPrograms
      },
      { status: 500 }
    );
  }

  const courseByCode = new Map((courseRows as DbCourse[] | null)?.map((c) => [c.code, c]) ?? []);

  const majorRequirements = codeOrder
    .map((code) => {
      const c = courseByCode.get(code);
      if (!c) return null;
      return mapCourse(c, typeByCode.get(code));
    })
    .filter(Boolean) as Course[];

  sortCoursesByCatalog(majorRequirements);

  const { data: oppRows, error: oppErr } = await supabase.from("opportunities").select("*").limit(40);

  let opportunities: Opportunity[] = [];
  if (!oppErr && oppRows?.length) {
    opportunities = oppRows.map((row) => mapOpportunity(row as Record<string, unknown>));
  }

  return NextResponse.json({
    error: null,
    majorRequirements,
    opportunities,
    electiveCourses,
    nonEngineeringCourses,
    studyAbroadPrograms
  });
}
