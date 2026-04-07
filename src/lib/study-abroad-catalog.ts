import type { StudyAbroadProgram } from "@/types/domain";
import raw from "./uva-study-abroad-programs.json";

type RawProg = (typeof raw.programs)[number];

function mapRaw(p: RawProg): StudyAbroadProgram {
  const pid = "program_id" in p && (p as { program_id?: string }).program_id;
  return {
    id: pid ? `iso-${pid}` : `listing:${p.title}:${p.term_bucket}`,
    title: p.title,
    detailUrl: p.url,
    termBucket: p.term_bucket,
    regionGroup: p.region_group ?? null,
    locationSummary: p.location_summary,
    termsOfferedText: p.terms_offered_text,
    description: p.academics_summary,
    coursesOffered: p.courses_offered ?? [],
    subjectAreas: p.subject_areas ?? [],
    tags: p.tags ?? [],
    creditNote: p.credit_note,
    walkerScholarship: p.walker_scholarship,
    transferCredit: p.transfer_credit,
    combinationCredit: p.combination_credit
  };
}

export const fallbackStudyAbroadPrograms: StudyAbroadProgram[] = raw.programs.map(mapRaw);

export const studyAbroadListingSource: string = String(raw.source ?? "");
