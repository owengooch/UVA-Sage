import { compareCourseCodesByCatalog } from "@/lib/course-interest-match";
import {
  ELECTIVE_FULFILLMENT_SECTION_ORDER,
  ELECTIVE_SECTION_UNTAGGED,
  pickPrimaryElectiveSectionTagForMajor,
  titleForElectiveFulfillmentTag
} from "@/lib/elective-fulfillment-tags";
import { courseAlignsWithStudentTrack, trackSubgroupingSupported } from "@/lib/engineering-track-course-match";
import { trackLabelForValue } from "@/lib/major-tracks";
import type { Course, RecommendedItem, StudentProfileInput } from "@/types/domain";

const AFamily = {
  accentBar: "bg-amber-500",
  headerGradient: "from-amber-50/90 via-amber-50/35 to-white",
  badgeClass: "bg-amber-100 text-amber-950 ring-amber-200/90"
};
const VFamily = {
  accentBar: "bg-violet-500",
  headerGradient: "from-violet-50/90 via-violet-50/35 to-white",
  badgeClass: "bg-violet-100 text-violet-950 ring-violet-200/90"
};
const BFamily = {
  accentBar: "bg-blue-600",
  headerGradient: "from-blue-50/90 via-blue-50/35 to-white",
  badgeClass: "bg-blue-100 text-blue-950 ring-blue-200/90"
};
const OFamily = {
  accentBar: "bg-orange-500",
  headerGradient: "from-orange-50/90 via-orange-50/35 to-white",
  badgeClass: "bg-orange-100 text-orange-950 ring-orange-200/90"
};
const TFamily = {
  accentBar: "bg-teal-500",
  headerGradient: "from-teal-50/90 via-teal-50/35 to-white",
  badgeClass: "bg-teal-100 text-teal-950 ring-teal-200/90"
};
const RFamily = {
  accentBar: "bg-rose-500",
  headerGradient: "from-rose-50/90 via-rose-50/35 to-white",
  badgeClass: "bg-rose-100 text-rose-950 ring-rose-200/90"
};
const EFamily = {
  accentBar: "bg-emerald-500",
  headerGradient: "from-emerald-50/90 via-emerald-50/35 to-white",
  badgeClass: "bg-emerald-100 text-emerald-950 ring-emerald-200/90"
};
const CFamily = {
  accentBar: "bg-cyan-500",
  headerGradient: "from-cyan-50/90 via-cyan-50/35 to-white",
  badgeClass: "bg-cyan-100 text-cyan-950 ring-cyan-200/90"
};
const SFamily = {
  accentBar: "bg-slate-400",
  headerGradient: "from-slate-100/90 via-slate-50/50 to-white",
  badgeClass: "bg-slate-100 text-slate-900 ring-slate-200/90"
};

export type ElectiveSectionVisual = {
  shortNavLabel: string;
  accentBar: string;
  headerGradient: string;
  badgeClass: string;
};

/** Accent + jump-link label for each Undergraduate Record elective bucket section. */
export function getElectiveSectionVisual(sectionKey: string): ElectiveSectionVisual {
  const fullTitle = titleForElectiveFulfillmentTag(sectionKey);
  const shortNavLabel = fullTitle.length > 34 ? `${fullTitle.slice(0, 31)}…` : fullTitle;

  if (sectionKey === ELECTIVE_SECTION_UNTAGGED) {
    return { shortNavLabel, ...SFamily };
  }

  const family = sectionKey.split(":")[0] ?? "";
  const base =
    family === "mae" || family === "aero"
      ? AFamily
      : family === "cpe"
        ? VFamily
        : family === "ce"
          ? BFamily
          : family === "che"
            ? OFamily
            : family === "ee"
              ? TFamily
              : family === "mse"
                ? RFamily
                : family === "es"
                  ? EFamily
                  : family === "seas" || family === "sys"
                    ? CFamily
                    : SFamily;

  return { shortNavLabel, ...base };
}

export function engineeringSectionAnchorId(sectionKey: string): string {
  return `engineering-elective-${sectionKey.replace(/:/g, "-")}`;
}

export type EngineeringCourseSubsection = {
  key: string;
  title: string;
  items: RecommendedItem<Course>[];
};

export type EngineeringCourseSection = {
  /** Fulfillment tag key or {@link ELECTIVE_SECTION_UNTAGGED}. */
  id: string;
  title: string;
  description: string;
  subsections: EngineeringCourseSubsection[];
};

function sortRecommendedItems(items: RecommendedItem<Course>[]): RecommendedItem<Course>[] {
  return [...items].sort(
    (a, b) => b.score - a.score || compareCourseCodesByCatalog(a.item.code, b.item.code)
  );
}

function subsectionItemsForSection(
  items: RecommendedItem<Course>[],
  profile: Pick<StudentProfileInput, "major" | "majorTrack">
): EngineeringCourseSubsection[] {
  const major = profile.major?.trim() ?? "";
  const track = profile.majorTrack?.trim() ?? "";
  if (!trackSubgroupingSupported(major, track)) {
    return [{ key: "all", title: "", items: sortRecommendedItems(items) }];
  }

  const aligned: RecommendedItem<Course>[] = [];
  const other: RecommendedItem<Course>[] = [];
  for (const rec of items) {
    if (courseAlignsWithStudentTrack(rec.item, profile)) aligned.push(rec);
    else other.push(rec);
  }

  if (aligned.length === 0 || other.length === 0) {
    const merged = aligned.length > 0 ? aligned : other;
    return [{ key: "all", title: "", items: sortRecommendedItems(merged) }];
  }

  const tl = trackLabelForValue(major, track);
  return [
    {
      key: "track",
      title: tl ? `Strong fit · ${tl}` : "Strong fit for your track",
      items: sortRecommendedItems(aligned)
    },
    { key: "other", title: "Also in this category", items: sortRecommendedItems(other) }
  ];
}

function sectionDescription(sectionKey: string): string {
  if (sectionKey === ELECTIVE_SECTION_UNTAGGED) {
    return "These courses are not tagged with a specific degree-elective bucket yet. Run npm run recompute:electives after catalog imports.";
  }
  return "Undergraduate Record footnote bucket for this elective type. Confirm credit rules and overlap on your official program page.";
}

/**
 * Groups engineering recommendations by primary `electiveFulfillments` tag (one section per catalog elective type).
 */
export function groupEngineeringRecommendations(
  items: RecommendedItem<Course>[],
  profile: Pick<StudentProfileInput, "major" | "majorTrack">
): EngineeringCourseSection[] {
  const buckets = new Map<string, RecommendedItem<Course>[]>();
  const major = profile.major?.trim() ?? "";

  for (const rec of items) {
    const primary = pickPrimaryElectiveSectionTagForMajor(rec.item.electiveFulfillments, major);
    const key = primary ?? ELECTIVE_SECTION_UNTAGGED;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(rec);
  }

  const orderedKeys: string[] = [];
  for (const id of ELECTIVE_FULFILLMENT_SECTION_ORDER) {
    if ((buckets.get(id)?.length ?? 0) > 0) orderedKeys.push(id);
  }
  const extras = [...buckets.keys()]
    .filter((k) => k !== ELECTIVE_SECTION_UNTAGGED && !ELECTIVE_FULFILLMENT_SECTION_ORDER.includes(k))
    .sort((a, b) => a.localeCompare(b));
  orderedKeys.push(...extras);
  if ((buckets.get(ELECTIVE_SECTION_UNTAGGED)?.length ?? 0) > 0) {
    orderedKeys.push(ELECTIVE_SECTION_UNTAGGED);
  }

  return orderedKeys.map((id) => {
    const raw = buckets.get(id) ?? [];
    return {
      id,
      title: titleForElectiveFulfillmentTag(id),
      description: sectionDescription(id),
      subsections: subsectionItemsForSection(raw, profile)
    };
  });
}
