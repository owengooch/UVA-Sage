import { humanLabelsForElectiveFulfillments } from "@/lib/elective-fulfillment-tags";
import { ELECTIVE_PREFIXES_BY_MAJOR } from "@/lib/elective-prefixes-by-major";
import { catalogNumberFromCode, subjectPrefixFromCode } from "@/lib/course-interest-match";
import type { Course, StudentProfileInput } from "@/types/domain";

const NORM = (c: string) => c.trim().replace(/\s+/g, " ").toUpperCase();

/** Re-export for callers that imported from this module. */
export { ELECTIVE_PREFIXES_BY_MAJOR };

const BSCS_FOUNDATION_AND_CORE = new Set(
  [
    "CS 2100",
    "CS 2120",
    "CS 2130",
    "CS 3100",
    "CS 3120",
    "CS 3130",
    "CS 3140",
    "CS 3240",
    "CS 4971",
    "CS 4980",
    "CS 4991"
  ].map(NORM)
);

/** BS CS elective pool (simplified from catalog): 3000+ CS, not foundation/capstone core, middle catalog digit not 0/9 (4993 allowed). */
function isBscsElectivePoolCourse(course: Course): boolean {
  const code = NORM(course.code);
  if (!code.startsWith("CS ")) return false;
  const n = catalogNumberFromCode(code);
  if (n < 3000) return false;
  if (BSCS_FOUNDATION_AND_CORE.has(code)) return false;
  const mid = Math.floor((n % 1000) / 100);
  if (mid === 0 || mid === 9) {
    return code.includes("4993");
  }
  return true;
}

function fulfillmentMatchesMajorPrefixes(fulfillments: string[], prefixes: string[]): string[] {
  const hits: string[] = [];
  for (const tag of fulfillments) {
    const t = tag.trim();
    if (!t) continue;
    if (prefixes.some((p) => t.startsWith(p))) hits.push(t);
  }
  return hits;
}

function civilTrackElectiveBonus(track: string, fulfillments: string[]): number {
  const tr = track.trim().toUpperCase();
  if (!tr) return 0;
  const f = fulfillments.map((x) => x.toLowerCase());
  let bonus = 0;
  if (tr === "EWR" && f.some((x) => x.includes("ewr"))) bonus += 10;
  if (tr === "SE" && f.some((x) => x.includes("structural") || x.includes("se_elective"))) bonus += 10;
  if (tr === "CEM" && f.some((x) => x.includes("cem"))) bonus += 10;
  if (tr === "IS" && f.some((x) => x.includes("technical_elective") || x === "ce:ce_elective")) bonus += 6;
  return bonus;
}

export type EngineeringElectiveRankBoost = {
  bonus: number;
  /** Short note for recommendation reason */
  electiveNote?: string;
};

/**
 * Score bump so the Engineering Courses tab prioritizes catalog degree-elective buckets for the student’s major
 * (and Civil track when set). Complements goal-keyword matching in {@link rankCourses}.
 */
export function engineeringElectiveRankingBoost(
  course: Course,
  profile: Pick<StudentProfileInput, "major" | "majorTrack">
): EngineeringElectiveRankBoost {
  const major = profile.major?.trim();
  if (!major) return { bonus: 0 };

  const prefixes = ELECTIVE_PREFIXES_BY_MAJOR[major];
  if (!prefixes) return { bonus: 0 };

  const fulfill = course.electiveFulfillments ?? [];
  let bonus = 0;
  const noteParts: string[] = [];

  if (major === "Computer Science (Engineering)" && isBscsElectivePoolCourse(course)) {
    bonus += 16;
    noteParts.push(
      "Typical BS CS elective pool (3000+; confirm digit/overlap rules and capstone choices in the catalog)."
    );
  }

  const matchedTags = fulfillmentMatchesMajorPrefixes(fulfill, prefixes);
  if (matchedTags.length > 0) {
    bonus += 14 + Math.min(matchedTags.length - 1, 6) * 3;
    const pretty = humanLabelsForElectiveFulfillments(matchedTags.slice(0, 2));
    noteParts.push(`Degree elective: ${pretty.join("; ")}.`);
  }

  if (major === "Civil Engineering") {
    const tBonus = civilTrackElectiveBonus(profile.majorTrack ?? "", fulfill);
    if (tBonus > 0) {
      bonus += tBonus;
      const tl = profile.majorTrack?.trim();
      noteParts.push(
        tl
          ? `Strong fit for Civil ${tl} track electives (catalog footnotes).`
          : "Strong fit for Civil track electives (catalog footnotes)."
      );
    }
  }

  if (bonus === 0) return { bonus: 0 };
  return { bonus, electiveNote: noteParts.join(" ") };
}
