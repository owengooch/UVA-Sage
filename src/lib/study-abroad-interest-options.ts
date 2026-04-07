export type StudyAbroadInterestOption = {
  value: string;
  label: string;
};

export type StudyAbroadInterestSection = {
  heading: string;
  options: StudyAbroadInterestOption[];
};

export type StudyAbroadCountryOption = StudyAbroadInterestOption & {
  /** Region `value`s from the Regions section; shown when any of these regions is selected. */
  regions: readonly string[];
};

/** Region chips used to filter the Countries & hubs section. */
export const STUDY_ABROAD_REGION_VALUES = [
  "europe",
  "asia",
  "africa",
  "latin",
  "middle",
  "caribbean",
  "australia",
  "canada"
] as const;

export type StudyAbroadRegionValue = (typeof STUDY_ABROAD_REGION_VALUES)[number];

const REGION_LABEL_BY_VALUE: Record<string, string> = {
  europe: "Europe",
  asia: "Asia",
  africa: "Africa",
  latin: "Latin America",
  middle: "Middle East",
  caribbean: "Caribbean",
  australia: "Australia / Oceania",
  canada: "Canada"
};

const STUDY_ABROAD_TIMING_SECTION: StudyAbroadInterestSection = {
  heading: "Timing",
  options: [
    { value: "summer", label: "Summer" },
    { value: "january", label: "January Term" },
    { value: "spring", label: "Spring term" },
    { value: "fall", label: "Fall term" }
  ]
};

const STUDY_ABROAD_REGIONS_SECTION: StudyAbroadInterestSection = {
  heading: "Regions",
  options: STUDY_ABROAD_REGION_VALUES.map((value) => ({
    value,
    label: REGION_LABEL_BY_VALUE[value] ?? value
  }))
};

const STUDY_ABROAD_LANGUAGES_SECTION: StudyAbroadInterestSection = {
  heading: "Languages & area studies",
  options: [
    { value: "language", label: "Language immersion" },
    { value: "spanish", label: "Spanish" },
    { value: "french", label: "French" },
    { value: "german", label: "German" },
    { value: "italian", label: "Italian" },
    { value: "arabic", label: "Arabic" },
    { value: "chinese", label: "Chinese" },
    { value: "japanese", label: "Japanese" },
    { value: "korean", label: "Korean" },
    { value: "russian", label: "Russian" },
    { value: "portuguese", label: "Portuguese" }
  ]
};

const STUDY_ABROAD_THEMES_SECTION: StudyAbroadInterestSection = {
  heading: "Academic themes",
  options: [
    { value: "engineering", label: "Engineering / technology" },
    { value: "stem", label: "STEM / sciences" },
    { value: "computer", label: "Computer science / computing" },
    { value: "business", label: "Business / economics" },
    { value: "health", label: "Health / pre-health" },
    { value: "environment", label: "Environment / sustainability" },
    { value: "political", label: "Politics / international affairs" },
    { value: "history", label: "History" },
    { value: "art", label: "Art / visual culture" },
    { value: "internship", label: "Internship / field experience" },
    { value: "research", label: "Research emphasis" }
  ]
};

/**
 * Country/hub `value` strings align with `study_abroad_programs.tags` where possible.
 * `regions` ties each hub to one or more region chips.
 */
export const STUDY_ABROAD_COUNTRY_OPTIONS: StudyAbroadCountryOption[] = [
  { value: "spain", label: "Spain", regions: ["europe"] },
  { value: "france", label: "France", regions: ["europe"] },
  { value: "germany", label: "Germany", regions: ["europe"] },
  { value: "italy", label: "Italy", regions: ["europe"] },
  { value: "netherlands", label: "Netherlands", regions: ["europe"] },
  { value: "portugal", label: "Portugal", regions: ["europe"] },
  { value: "greece", label: "Greece", regions: ["europe"] },
  { value: "ireland", label: "Ireland", regions: ["europe"] },
  { value: "scandinavia", label: "Scandinavia", regions: ["europe"] },
  { value: "czech", label: "Czech Republic", regions: ["europe"] },
  { value: "hungary", label: "Hungary", regions: ["europe"] },
  { value: "austria", label: "Austria", regions: ["europe"] },
  { value: "belgium", label: "Belgium", regions: ["europe"] },
  { value: "switzerland", label: "Switzerland", regions: ["europe"] },
  { value: "japan", label: "Japan", regions: ["asia"] },
  { value: "china", label: "China", regions: ["asia"] },
  { value: "korea", label: "Korea", regions: ["asia"] },
  { value: "india", label: "India", regions: ["asia"] },
  { value: "vietnam", label: "Vietnam", regions: ["asia"] },
  { value: "thailand", label: "Thailand", regions: ["asia"] },
  { value: "singapore", label: "Singapore", regions: ["asia"] },
  { value: "taiwan", label: "Taiwan", regions: ["asia"] },
  { value: "indonesia", label: "Indonesia", regions: ["asia"] },
  { value: "mexico", label: "Mexico", regions: ["latin"] },
  { value: "brazil", label: "Brazil", regions: ["latin"] },
  { value: "chile", label: "Chile", regions: ["latin"] },
  { value: "argentina", label: "Argentina", regions: ["latin"] },
  { value: "colombia", label: "Colombia", regions: ["latin"] },
  { value: "peru", label: "Peru", regions: ["latin"] },
  { value: "costa", label: "Costa Rica", regions: ["latin", "caribbean"] },
  { value: "panama", label: "Panama", regions: ["latin", "caribbean"] },
  { value: "morocco", label: "Morocco", regions: ["africa", "middle"] },
  { value: "kenya", label: "Kenya", regions: ["africa"] },
  { value: "egypt", label: "Egypt", regions: ["africa", "middle"] },
  { value: "israel", label: "Israel", regions: ["middle"] },
  { value: "australia", label: "Australia", regions: ["australia"] },
  { value: "zealand", label: "New Zealand", regions: ["australia"] },
  { value: "canada", label: "Canada", regions: ["canada"] }
];

const REGION_SET = new Set<string>(STUDY_ABROAD_REGION_VALUES);

/** Whether this interest token is one of the region chips (used for filtering countries). */
export function isStudyAbroadRegionValue(token: string): boolean {
  return REGION_SET.has(token.toLowerCase().trim());
}

export function filterStudyAbroadCountriesByRegions(
  selectedInterestTokens: string[]
): StudyAbroadInterestOption[] {
  const selected = new Set(
    selectedInterestTokens.map((t) => t.toLowerCase().trim()).filter(Boolean)
  );
  const pickedRegions = STUDY_ABROAD_REGION_VALUES.filter((r) => selected.has(r));
  if (pickedRegions.length === 0) {
    return STUDY_ABROAD_COUNTRY_OPTIONS.map(({ value, label }) => ({ value, label }));
  }
  const active = new Set<string>(pickedRegions);
  return STUDY_ABROAD_COUNTRY_OPTIONS.filter((c) => c.regions.some((r) => active.has(r))).map(
    ({ value, label }) => ({ value, label })
  );
}

function countriesSectionHeading(pickedRegions: StudyAbroadRegionValue[]): string {
  if (pickedRegions.length === 0) {
    return "Countries & hubs (sample)";
  }
  const labels = pickedRegions.map((r) => REGION_LABEL_BY_VALUE[r] ?? r);
  return `Countries & hubs (${labels.join(" · ")})`;
}

/**
 * Full study-abroad questionnaire sections. Country/hub options are filtered to match selected region chips;
 * with no regions selected, all sample countries are shown.
 */
export function buildStudyAbroadInterestSections(
  selectedInterestTokens: string[]
): StudyAbroadInterestSection[] {
  const selected = new Set(
    selectedInterestTokens.map((t) => t.toLowerCase().trim()).filter(Boolean)
  );
  const pickedRegions = STUDY_ABROAD_REGION_VALUES.filter((r) => selected.has(r));
  const countryOptions = filterStudyAbroadCountriesByRegions(selectedInterestTokens);

  return [
    STUDY_ABROAD_TIMING_SECTION,
    STUDY_ABROAD_REGIONS_SECTION,
    {
      heading: countriesSectionHeading(pickedRegions),
      options: countryOptions
    },
    STUDY_ABROAD_LANGUAGES_SECTION,
    STUDY_ABROAD_THEMES_SECTION
  ];
}

/**
 * Static full list (no region filter). Prefer {@link buildStudyAbroadInterestSections} in the onboarding UI.
 */
export const STUDY_ABROAD_INTEREST_SECTIONS: StudyAbroadInterestSection[] =
  buildStudyAbroadInterestSections([]);

const LABEL_BY_VALUE: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const opt of STUDY_ABROAD_TIMING_SECTION.options) m.set(opt.value.toLowerCase(), opt.label);
  for (const opt of STUDY_ABROAD_REGIONS_SECTION.options) m.set(opt.value.toLowerCase(), opt.label);
  for (const opt of STUDY_ABROAD_COUNTRY_OPTIONS) m.set(opt.value.toLowerCase(), opt.label);
  for (const opt of STUDY_ABROAD_LANGUAGES_SECTION.options) m.set(opt.value.toLowerCase(), opt.label);
  for (const opt of STUDY_ABROAD_THEMES_SECTION.options) m.set(opt.value.toLowerCase(), opt.label);
  return m;
})();

export function studyAbroadInterestLabel(stored: string): string {
  return LABEL_BY_VALUE.get(stored.toLowerCase().trim()) ?? stored;
}

/** True when the student supplied study-abroad chips and/or legacy goal text. */
export function profileHasStudyAbroadSignals(profile: {
  studyAbroadGoal?: string;
  studyAbroadInterests?: string[] | null;
}): boolean {
  if (profile.studyAbroadGoal?.trim()) return true;
  return (profile.studyAbroadInterests?.length ?? 0) > 0;
}
