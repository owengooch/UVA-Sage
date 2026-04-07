import type { StudyAbroadProgram } from "@/types/domain";

const MAX_SUMMARY_WORDS = 40;

/** Brochure sections we strip — details belong in the modal or duplicate the ISO page. */
const TAIL_MARKERS = [
  /\bFINANCIAL AID\b/i,
  /\bELIGIBILITY REQUIREMENTS\b/i,
  /\bAPPLICATION DEADLINES\b/i,
  /\bINTERESTED IN LEARNING MORE\b/i,
  /\bQUESTIONS\?\b/i,
  /\bComplete program information, including an online application\b/i,
  /\bRead what past program participants\b/i,
  /\bCheck out our Facebook\b/i,
  /\bContact American Councils\b/i,
  /\bConsult the [A-Z]+ website for additional information\b/i,
  /\bInstructions for completing the petition\b/i,
  /\bLanguage of Instruction:\s*/i,
  /\bLanguage Courses Offered:\s*/i,
  /\bWhat'?s Included\b/i,
  /\bPersonal Advising:\b/i,
  /\bHealth & Safety:\b/i,
  /\bOn-the-Ground Staff\b/i,
  /\bCultural Activities:\b/i
];

const NOISE_LINE =
  /^(www\.|https?:\/\/|visit\s+www|email\s|@\w+\.|facebook|twitter|instagram|blog\s+website)/i;

const INFORMATIVE_HINTS =
  /\b(credit|hour|week|semester|course|taught|housing|homestay|dorm|internship|excursion|field study|language pledge|enroll|faculty|curriculum|research|studio|lab|prerequisite|gpa|intensive|immersion|direct\s+enroll|exchange)\b/i;

const ACADEMIC_FOCUS_HINTS =
  /\b(globalization|economies in transition|business practices|institutions|markets|culture|civilization|political|society|sustainable|urban|technology consulting)\b/i;

const APPLY_NOISE =
  /\b(online education abroad workshop|not to the specific program|apply to the\s+"|complete the online education)\b/i;

function normalizeWs(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function tokenizeWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/** Words already shown on the card or in the modal header / subject list — de-emphasize repetition. */
function buildContextTokenSet(program: Pick<StudyAbroadProgram, "title" | "locationSummary" | "termsOfferedText" | "subjectAreas">): Set<string> {
  const parts = [
    program.title,
    program.locationSummary,
    program.termsOfferedText,
    ...(program.subjectAreas ?? [])
  ];
  const set = new Set<string>();
  for (const p of parts) {
    for (const w of tokenizeWords(p)) {
      set.add(w);
    }
  }
  return set;
}

function stripBoilerplateTail(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n");
  const paraBreak = t.indexOf("\n\n");
  if (paraBreak !== -1) {
    const after = t.slice(paraBreak);
    if (/\bLanguage of Instruction:/i.test(after)) {
      t = t.slice(0, paraBreak).trim();
    }
  }

  t = normalizeWs(t);
  let bestEnd = t.length;
  for (const re of TAIL_MARKERS) {
    const m = t.match(re);
    if (m && m.index != null && m.index >= 60) {
      bestEnd = Math.min(bestEnd, m.index);
    }
  }
  t = t.slice(0, bestEnd).trim();
  return normalizeWs(t);
}

/** Turn embedded section labels into sentence breaks so we don’t treat a whole brochure page as one sentence. */
function normalizeBrochureHeadings(raw: string): string {
  return normalizeWs(
    raw
      .replace(/\s+About the Program\s+/gi, ". ")
      .replace(/\s+Program Overview\s+/gi, ". ")
      .replace(/\s+Overview\s+The\s+/gi, ". The ")
  );
}

/** Split “City A | City B long clause…” style openers into separate clauses for scoring. */
function expandClauseChunks(sentences: string[]): string[] {
  const out: string[] = [];
  for (const s of sentences) {
    if (s.includes(" | ") && s.length > 130) {
      const parts = s.split(/\s*\|\s*/).map(normalizeWs).filter((p) => p.length > 14);
      if (parts.length > 1) {
        out.push(...parts);
        continue;
      }
    }
    out.push(s);
  }
  return out;
}

function splitSentences(text: string): string[] {
  /** Brochures often run `) The` without a period between a title line and the next sentence. */
  const withBreaks = text.replace(/\)\s+(?=The\s+[A-Za-z])/g, "). ");
  const rough = withBreaks.split(/(?<=[.!?])\s+(?=[A-Z(0-9"'])/);
  const out: string[] = [];
  for (const s of rough) {
    const x = normalizeWs(s);
    if (x.length > 0) out.push(x);
  }
  return out.length > 0 ? out : [normalizeWs(text)];
}

function isAllCapsHeader(s: string): boolean {
  const letters = s.replace(/[^A-Za-z]/g, "");
  if (letters.length < 20) return false;
  const upper = letters.replace(/[a-z]/g, "").length;
  return upper / letters.length > 0.85;
}

function sentenceScore(sentence: string, context: Set<string>): number {
  const lower = sentence.toLowerCase();
  if (NOISE_LINE.test(lower)) return -10;
  if (lower.includes("www.") || lower.includes("@")) return -8;
  if (isAllCapsHeader(sentence)) return -6;

  const words = tokenizeWords(sentence);
  if (words.length < 4) return -4;

  let overlap = 0;
  for (const w of words) {
    if (context.has(w)) overlap++;
  }
  const overlapRatio = words.length > 0 ? overlap / words.length : 0;
  let score = 2 - overlapRatio * 5;

  if (INFORMATIVE_HINTS.test(sentence)) score += 1.2;
  if (ACADEMIC_FOCUS_HINTS.test(sentence)) score += 0.9;
  if (/\d/.test(sentence)) score += 0.8;
  if (/petition|high risk|department of state advisory/i.test(sentence)) score += 1.5;
  if (/^\s*students interested in applying/i.test(lower)) score -= 0.5;
  if (/^approved for uva students in/i.test(lower)) score -= 1;
  if (APPLY_NOISE.test(lower)) score -= 4;
  if (/mcintire students:/i.test(sentence)) score -= 3;
  if (/what'?s included|personal advising:|on-the-ground staff|health & safety:/i.test(lower)) score -= 6;

  return score;
}

function takeWords(text: string, maxWords: number): string {
  const words = normalizeWs(text).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}…`;
}

/**
 * Up to 40 words: strips ISO footer blocks, avoids repeating title/location/terms/subjects where possible,
 * and prefers concrete academic and logistics detail.
 */
export function summarizeStudyAbroadProgram(
  program: Pick<
    StudyAbroadProgram,
    "description" | "title" | "locationSummary" | "termsOfferedText" | "subjectAreas"
  >
): string {
  const body = stripBoilerplateTail(normalizeBrochureHeadings(program.description ?? ""));
  if (!body) return "";

  const context = buildContextTokenSet(program);
  const sentences = expandClauseChunks(splitSentences(body));

  const picked: string[] = [];
  let wordCount = 0;
  const seen = new Set<string>();

  const tryAppend = (sentence: string, minScore: number): boolean => {
    const sc = sentenceScore(sentence, context);
    if (sc < minScore) return false;
    const key = sentence.slice(0, 80).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);

    const words = normalizeWs(sentence).split(/\s+/).filter(Boolean);
    if (words.length === 0) return false;

    const remaining = MAX_SUMMARY_WORDS - wordCount;
    if (remaining <= 0) return false;

    if (words.length <= remaining) {
      picked.push(words.join(" "));
      wordCount += words.length;
      return true;
    }

    picked.push(`${words.slice(0, remaining).join(" ")}…`);
    wordCount = MAX_SUMMARY_WORDS;
    return true;
  };

  /** Document order: prefer informative sentences, then relax if we still have little text. */
  for (const s of sentences) {
    if (wordCount >= MAX_SUMMARY_WORDS) break;
    tryAppend(s, 0.5);
  }
  if (wordCount < 24) {
    for (const s of sentences) {
      if (wordCount >= MAX_SUMMARY_WORDS) break;
      tryAppend(s, -1.5);
    }
  }

  if (picked.length === 0) {
    return takeWords(body, MAX_SUMMARY_WORDS);
  }

  return takeWords(picked.join(" "), MAX_SUMMARY_WORDS);
}

/** @deprecated Use {@link summarizeStudyAbroadProgram} with full program context. */
export function summarizeStudyAbroadDescription(raw: string, _maxLen?: number): string {
  return summarizeStudyAbroadProgram({
    description: raw,
    title: "",
    locationSummary: "",
    termsOfferedText: "",
    subjectAreas: []
  });
}
