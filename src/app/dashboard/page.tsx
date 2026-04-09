"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buildDashboardData, type DashboardSupplemental } from "@/lib/recommendations";
import { trackLabelForValue } from "@/lib/major-tracks";
import { pruneOutsideInterestDetails } from "@/lib/outside-interest-options";
import { mergeCompletionLists } from "@/lib/completions-merge";
import { fetchProfileForBrowserClient, putProfileForBrowserClient } from "@/lib/fetch-profile-client";
import { stripToSavedPayload } from "@/lib/saved-profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { expandedCourseTagLabels } from "@/lib/course-tags-display";
import {
  DEGREE_ELECTIVE_TAG_PREFIX,
  humanLabelsForElectiveFulfillments
} from "@/lib/elective-fulfillment-tags";
import {
  engineeringSectionAnchorId,
  getElectiveSectionVisual,
  groupEngineeringRecommendations
} from "@/lib/engineering-course-sections";
import { trackSubgroupingSupported } from "@/lib/engineering-track-course-match";
import {
  isEngineeringFocusStudyAbroad,
  profileLooksEngineeringMajor
} from "@/lib/engineering-study-abroad-priority";
import { profileHasStudyAbroadSignals } from "@/lib/study-abroad-interest-options";
import { summarizeStudyAbroadProgram } from "@/lib/study-abroad-description";
import { sortCoursesByCatalog } from "@/lib/course-interest-match";
import { parseStoredProfile } from "@/lib/student-profile";
import type {
  Course,
  DashboardData,
  Opportunity,
  StudentProfileInput,
  StudyAbroadProgram
} from "@/types/domain";

const emptyProfile: StudentProfileInput = {
  major: "",
  graduationYear: "",
  researchGoal: "",
  internshipGoal: "",
  studyAbroadGoal: "",
  studyAbroadInterests: [],
  outsideInterests: [],
  outsideInterestDetails: [],
  completedCourseCodes: []
};

/** Full-width recommendations panel (one per tab). */
const WidePanel = ({
  title,
  description,
  children
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
    {description ? (
      <div className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">{description}</div>
    ) : null}
    <div className="mt-8 space-y-5">{children}</div>
  </section>
);

const EmptyState = ({ message }: { message: string }) => (
  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-5 py-6 text-base leading-relaxed text-slate-600">
    {message}
  </p>
);

/** Same layout as course grids: 1 / 2 / 3 columns by breakpoint. */
function CatalogGridThreeColumns<T>({
  items,
  getKey,
  renderItem
}: {
  items: T[];
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <ul className="grid list-none grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <li key={getKey(item, index)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

function CourseGridThreeColumns({
  courses,
  renderItem
}: {
  courses: Course[];
  renderItem: (course: Course, index: number) => React.ReactNode;
}) {
  return (
    <CatalogGridThreeColumns
      items={courses}
      getKey={(course, index) => `${course.code}-${index}`}
      renderItem={renderItem}
    />
  );
}

function CourseDetailModal({
  course,
  reason,
  open,
  onClose
}: {
  course: Course | null;
  reason?: string | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !course) return null;

  const tagLabels = expandedCourseTagLabels(
    course.tags?.filter((t) => !t.startsWith(DEGREE_ELECTIVE_TAG_PREFIX))
  );
  const degreeElectiveLabels = humanLabelsForElectiveFulfillments(course.electiveFulfillments ?? []);
  const majorsLine =
    (course.majors?.length ?? 0) > 0 ? course.majors.join(", ") : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-modal-title"
        className="max-h-[min(90vh,40rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold tracking-tight text-slate-600">{course.code}</p>
            <h2 id="course-modal-title" className="mt-1 text-xl font-bold leading-snug text-slate-900">
              {course.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            aria-label="Close"
          >
            Close
          </button>
        </div>
        <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 font-medium text-slate-500">Credits</dt>
            <dd className="text-slate-900">{course.credits}</dd>
          </div>
          {course.professor ? (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 font-medium text-slate-500">Instructor</dt>
              <dd className="text-slate-900">{course.professor}</dd>
            </div>
          ) : null}
          {course.requirementType ? (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 font-medium text-slate-500">Requirement</dt>
              <dd className="capitalize text-slate-900">{course.requirementType.replace(/_/g, " ")}</dd>
            </div>
          ) : null}
          {majorsLine ? (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 font-medium text-slate-500">Majors</dt>
              <dd className="text-slate-900">{majorsLine}</dd>
            </div>
          ) : null}
          {degreeElectiveLabels.length > 0 ? (
            <div className="flex items-start gap-2">
              <dt className="w-24 shrink-0 pt-0.5 font-medium text-slate-500">Degree electives</dt>
              <dd className="flex min-w-0 flex-1 flex-wrap gap-2">
                {degreeElectiveLabels.map((label, i) => (
                  <span
                    key={`deg-${label}-${i}`}
                    className="inline-flex rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-950"
                  >
                    {label}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
          {tagLabels.length > 0 ? (
            <div className="flex items-start gap-2">
              <dt className="w-24 shrink-0 pt-0.5 font-medium text-slate-500">Tags</dt>
              <dd className="flex min-w-0 flex-1 flex-wrap gap-2">
                {tagLabels.map((label, i) => (
                  <span
                    key={`${label}-${i}`}
                    className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800"
                  >
                    {label}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</h3>
          <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-slate-800">{course.description}</p>
        </div>
        {reason ? (
          <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">{reason}</p>
        ) : null}
      </div>
    </div>
  );
}

function formatRequirementLabel(t: string | undefined) {
  if (!t) return null;
  return t.replace(/_/g, " ");
}

function RequirementCourseCard({
  course,
  checked,
  onToggle,
  onOpenDetails
}: {
  course: Course;
  checked: boolean;
  onToggle: (code: string, nextChecked: boolean) => void;
  onOpenDetails: (course: Course) => void;
}) {
  return (
    <article
      className={`flex gap-2 rounded-lg border p-3 ${
        checked ? "border-slate-200 bg-slate-50/90" : "border-slate-200 bg-white"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(course.code, e.target.checked)}
        aria-label={`Mark ${course.code} complete`}
        className="mt-1.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
      />
      <div className="min-w-0 flex-1">
        {course.requirementType ? (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            {formatRequirementLabel(course.requirementType)}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => onOpenDetails(course)}
          className={`w-full rounded-md border border-transparent px-0 py-1 text-left transition hover:border-slate-200 hover:bg-white ${
            checked ? "text-slate-600" : "text-slate-900"
          }`}
        >
          <span className={`line-clamp-4 text-sm font-semibold leading-snug ${checked ? "line-through" : ""}`}>
            {course.title}
          </span>
          <span className="mt-1 block font-mono text-xs font-medium tracking-tight text-slate-500">{course.code}</span>
        </button>
        <p className="mt-1 text-xs text-slate-600">
          {course.professor ? `${course.credits} cr. · ${course.professor}` : `${course.credits} cr.`}
        </p>
      </div>
    </article>
  );
}

function RecommendedCourseCell({
  course,
  onOpenDetails,
  variant = "default"
}: {
  course: Course;
  onOpenDetails: (course: Course) => void;
  /** Richer card layout for the Engineering Courses tab. */
  variant?: "default" | "engineering";
}) {
  const dept = course.code.trim().split(/\s+/)[0]?.toUpperCase() ?? "";
  if (variant === "engineering") {
    return (
      <button
        type="button"
        onClick={() => onOpenDetails(course)}
        className="group flex h-full w-full flex-col rounded-xl border border-slate-200/90 bg-white p-4 text-left shadow-sm ring-1 ring-slate-900/[0.04] transition hover:border-blue-400/70 hover:shadow-md hover:ring-blue-500/15"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="line-clamp-3 min-w-0 text-sm font-semibold leading-snug text-slate-900 group-hover:text-blue-950">
            {course.title}
          </span>
          {dept ? (
            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
              {dept}
            </span>
          ) : null}
        </div>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-t border-slate-100 pt-3">
          <span className="font-mono text-xs font-semibold tracking-tight text-slate-700">{course.code}</span>
          <span className="text-xs tabular-nums text-slate-500">{course.credits} cr.</span>
        </div>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onOpenDetails(course)}
      className="flex h-full w-full flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/40"
    >
      <span className="line-clamp-5 text-sm font-semibold leading-snug text-slate-900">{course.title}</span>
      <span className="mt-2 font-mono text-xs font-medium tracking-tight text-slate-500">{course.code}</span>
    </button>
  );
}

function StudyAbroadProgramCell({
  program,
  onOpenDetails
}: {
  program: StudyAbroadProgram;
  onOpenDetails: (program: StudyAbroadProgram) => void;
}) {
  const summary = summarizeStudyAbroadProgram(program);
  return (
    <button
      type="button"
      onClick={() => onOpenDetails(program)}
      className="flex h-full w-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/40"
    >
      <span className="line-clamp-3 min-w-0 text-sm font-semibold leading-snug text-slate-900">
        {program.title}
      </span>
      <span className="mt-2 min-w-0 text-xs font-medium text-slate-500">{program.locationSummary}</span>
      {summary ? (
        <span className="mt-2 line-clamp-3 min-w-0 block text-sm leading-snug text-slate-600">{summary}</span>
      ) : (
        <span className="mt-2 block text-sm italic text-slate-400">No description in catalog.</span>
      )}
      <span className="mt-3 line-clamp-2 min-w-0 text-xs text-slate-500">{program.termsOfferedText}</span>
    </button>
  );
}

function StudyAbroadProgramModal({
  program,
  reason,
  open,
  onClose
}: {
  program: StudyAbroadProgram | null;
  reason?: string | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !program) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-abroad-modal-title"
        className="max-h-[min(90vh,44rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="study-abroad-modal-title" className="text-xl font-bold leading-snug text-slate-900">
              {program.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{program.locationSummary}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            aria-label="Close"
          >
            Close
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
            {program.termsOfferedText}
          </span>
          {program.termBucket === "spring_embedded" ? (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
              Spring embedded
            </span>
          ) : null}
          {isEngineeringFocusStudyAbroad(program) ? (
            <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-900">
              Engineering focus
            </span>
          ) : null}
          {program.walkerScholarship ? (
            <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-900">
              Walker Global Experiences eligible
            </span>
          ) : null}
          {program.transferCredit ? (
            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              Transfer credit
            </span>
          ) : null}
          {program.combinationCredit ? (
            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              Combination credit
            </span>
          ) : null}
        </div>
        {program.regionGroup ? (
          <p className="mt-3 text-sm text-slate-500">Listing region: {program.regionGroup}</p>
        ) : null}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</h3>
          <p className="mt-2 text-base leading-relaxed text-slate-800">{summarizeStudyAbroadProgram(program)}</p>
          <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-800">
              Full brochure text (from catalog)
            </summary>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{program.description}</p>
          </details>
        </div>
        {program.subjectAreas.length > 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Subject areas: </span>
            {program.subjectAreas.join(", ")}
          </p>
        ) : null}
        {program.coursesOffered.length > 0 ? (
          <div className="mt-3">
            <p className="text-sm font-medium text-slate-800">Courses highlighted in Sage</p>
            <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
              {program.coursesOffered.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Courses: </span>
            See the program&apos;s <span className="font-medium">Academics</span> tab on the ISO site for the official
            list by term.
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">{program.creditNote}</p>
        {reason ? (
          <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">{reason}</p>
        ) : null}
        {program.detailUrl ? (
          <a
            href={program.detailUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-medium text-blue-700 underline-offset-2 hover:underline"
          >
            Open program page (ISO)
          </a>
        ) : null}
      </div>
    </div>
  );
}

type DashboardApiPayload = {
  error: string | null;
  majorRequirements?: Course[];
  opportunities?: Opportunity[];
  electiveCourses?: Course[];
  nonEngineeringCourses?: Course[];
  studyAbroadPrograms?: StudyAbroadProgram[];
  hint?: string | null;
};

const DASHBOARD_TABS = [
  { id: "required" as const, label: "Required Courses", shortLabel: "Required" },
  { id: "engineering" as const, label: "Engineering Courses", shortLabel: "Engineering" },
  { id: "research" as const, label: "Research", shortLabel: "Research" },
  { id: "internship" as const, label: "Internships", shortLabel: "Internships" },
  { id: "studyAbroad" as const, label: "Study Abroad", shortLabel: "Abroad" },
  { id: "outside" as const, label: "Beyond Engineering", shortLabel: "Beyond Eng." },
  { id: "discovery" as const, label: "Discovery Tools", shortLabel: "Tools" }
] as const;

type DashboardTab = (typeof DASHBOARD_TABS)[number]["id"];

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfileInput>(emptyProfile);
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [supplemental, setSupplemental] = useState<DashboardSupplemental | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiHint, setApiHint] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("engineering");
  const [completionsAccountSync, setCompletionsAccountSync] = useState(false);
  const [courseModal, setCourseModal] = useState<{ course: Course; reason?: string } | null>(null);
  const [studyAbroadModal, setStudyAbroadModal] = useState<{
    program: StudyAbroadProgram;
    reason?: string;
  } | null>(null);

  const openCourseDetail = useCallback((course: Course, reason?: string) => {
    setCourseModal({ course, reason });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.user) {
        router.replace(`/login?next=${encodeURIComponent("/dashboard")}`);
        return;
      }

      let localProfile: StudentProfileInput = emptyProfile;
      const stored = localStorage.getItem("uvaProfile");
      if (stored) {
        try {
          localProfile = parseStoredProfile(stored);
        } catch {
          try {
            localProfile = JSON.parse(stored) as StudentProfileInput;
          } catch {
            /* keep empty */
          }
        }
      }

      let prof = await fetchProfileForBrowserClient();
      if (cancelled) return;
      if (!prof.ok) {
        if (prof.status === 401) {
          router.replace(`/login?next=${encodeURIComponent("/dashboard")}`);
          return;
        }
        setBootError("We could not load your saved profile. Check your connection and refresh this page.");
        return;
      }

      let data = prof.data;
      if (cancelled) return;

      if (data?.saved === false && localProfile.major?.trim()) {
        const put = await putProfileForBrowserClient(stripToSavedPayload(localProfile));
        if (put.ok) {
          prof = await fetchProfileForBrowserClient();
          if (!prof.ok) {
            setBootError("Profile save may have worked, but we could not reload it. Please refresh.");
            return;
          }
          data = prof.data;
        }
      }

      if (cancelled) return;
      if (!data || data.saved !== true) {
        router.replace("/onboarding");
        return;
      }

      const next: StudentProfileInput = {
        ...localProfile,
        sageUsername: data.sageUsername ?? localProfile.sageUsername,
        uvaEmail: data.uvaEmail ?? localProfile.uvaEmail,
        major: data.major,
        majorTrack: data.majorTrack,
        graduationYear: data.graduationYear,
        researchGoal: data.researchGoal,
        internshipGoal: data.internshipGoal,
        studyAbroadGoal: data.studyAbroadGoal,
        studyAbroadInterests: data.studyAbroadInterests ?? [],
        outsideInterests: data.outsideInterests ?? [],
        outsideInterestDetails: pruneOutsideInterestDetails(
          data.outsideInterests ?? [],
          data.outsideInterestDetails ?? []
        ),
        completedCourseCodes: localProfile.completedCourseCodes ?? [],
        onboardingCompleted: true
      };
      localStorage.setItem("uvaProfile", JSON.stringify(next));
      setProfile(next);
      setReady(true);
    })().catch(() => {
      if (!cancelled) setBootError("Something went wrong loading the dashboard. Please refresh.");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/completions");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          courseCodes?: string[];
          authenticated?: boolean;
        };
        if (cancelled) return;
        const authenticated = data.authenticated === true;
        setCompletionsAccountSync(authenticated);
        if (!authenticated) return;
        const remote = data.courseCodes ?? [];
        setProfile((prev) => {
          const merged = mergeCompletionLists(prev.completedCourseCodes, remote);
          const next = { ...prev, completedCourseCodes: merged };
          localStorage.setItem("uvaProfile", JSON.stringify(next));
          void fetch("/api/completions", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseCodes: merged })
          });
          return next;
        });
      } catch {
        /* offline or unreachable */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !profile.major) return;

    const q = new URLSearchParams({ major: profile.major });
    if (profile.majorTrack?.trim()) q.set("majorTrack", profile.majorTrack.trim());

    const ac = new AbortController();
    setApiError(null);
    setApiHint(null);

    fetch(`/api/dashboard?${q.toString()}`, { signal: ac.signal })
      .then(async (res) => {
        const body = (await res.json()) as DashboardApiPayload;
        if (!res.ok) {
          setSupplemental(null);
          setApiError(body.error ?? res.statusText);
          return;
        }
        if (body.error) {
          setSupplemental(null);
          setApiError(body.error);
          return;
        }
        setApiHint(body.hint ?? null);
        const mr = body.majorRequirements ?? [];
        const op = body.opportunities ?? [];
        const ec = body.electiveCourses ?? [];
        const ne = body.nonEngineeringCourses ?? [];
        const sa = body.studyAbroadPrograms ?? [];
        if (mr.length === 0 && op.length === 0 && ec.length === 0 && ne.length === 0 && sa.length === 0) {
          setSupplemental(null);
        } else {
          setSupplemental({
            majorRequirements: mr,
            opportunities: op,
            electiveCourses: ec,
            nonEngineeringCourses: ne,
            studyAbroadPrograms: sa.length ? sa : undefined
          });
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setSupplemental(null);
        setApiError(err instanceof Error ? err.message : "Failed to load catalog from server.");
      });

    return () => ac.abort();
  }, [ready, profile.major, profile.majorTrack]);

  const dashboard: DashboardData | null = useMemo(() => {
    if (!profile.major) return null;
    if (!supplemental) return buildDashboardData(profile);
    return buildDashboardData(profile, {
      majorRequirements: supplemental.majorRequirements?.length ? supplemental.majorRequirements : undefined,
      opportunities: supplemental.opportunities?.length ? supplemental.opportunities : undefined,
      electiveCourses: supplemental.electiveCourses?.length ? supplemental.electiveCourses : undefined,
      nonEngineeringCourses: supplemental.nonEngineeringCourses?.length ? supplemental.nonEngineeringCourses : undefined,
      studyAbroadPrograms: supplemental.studyAbroadPrograms?.length ? supplemental.studyAbroadPrograms : undefined
    });
  }, [profile, supplemental]);

  const requirementsSplit = useMemo(() => {
    if (!dashboard?.majorRequirements.length) {
      return { remaining: [] as Course[], completed: [] as Course[] };
    }
    const codesInPlan = new Set(dashboard.majorRequirements.map((c) => c.code));
    const doneCodes = new Set(
      (profile.completedCourseCodes ?? []).filter((c) => codesInPlan.has(c))
    );
    const remaining: Course[] = [];
    const completed: Course[] = [];
    for (const c of dashboard.majorRequirements) {
      if (doneCodes.has(c.code)) completed.push(c);
      else remaining.push(c);
    }
    sortCoursesByCatalog(remaining);
    sortCoursesByCatalog(completed);
    return { remaining, completed };
  }, [dashboard?.majorRequirements, profile.completedCourseCodes]);

  const engineeringSections = useMemo(() => {
    if (!dashboard?.recommendedCourses.length) return [];
    return groupEngineeringRecommendations(dashboard.recommendedCourses, profile);
  }, [dashboard?.recommendedCourses, profile]);

  const engineeringReasonByCode = useMemo(() => {
    const m = new Map<string, string>();
    if (!dashboard?.recommendedCourses) return m;
    for (const r of dashboard.recommendedCourses) {
      const code = r.item.code.trim().replace(/\s+/g, " ").toUpperCase();
      if (!m.has(code)) m.set(code, r.reason);
    }
    return m;
  }, [dashboard?.recommendedCourses]);

  const engineeringTabDescription = useMemo(() => {
    const base =
      "Degree-elective and math/science pool courses for your major (not the Required Courses tab list, and not HSS or unrestricted electives). Categories follow Undergraduate Record footnote tags (computed from each course if the database row is not backfilled yet — run npm run recompute:electives to persist tags and merge labels into course chips). Required-plan courses are excluded. Stronger matches appear first.";
    if (trackSubgroupingSupported(profile.major?.trim() ?? "", profile.majorTrack)) {
      return `${base} With a track or focus on your profile, in-category rows use catalog tags (Civil) or title/description keywords (other majors); confirm all rules in the official catalog.`;
    }
    return base;
  }, [profile.major, profile.majorTrack]);

  const toggleRequirementCompleted = useCallback(
    (code: string, isCompleted: boolean) => {
      if (!dashboard?.majorRequirements.length) return;
      const valid = new Set(dashboard.majorRequirements.map((c) => c.code));
      if (!valid.has(code)) return;
      setProfile((prev) => {
        const cur = new Set(prev.completedCourseCodes ?? []);
        if (isCompleted) cur.add(code);
        else cur.delete(code);
        const nextCodes = [...cur];
        const next = { ...prev, completedCourseCodes: nextCodes };
        localStorage.setItem("uvaProfile", JSON.stringify(next));
        void fetch("/api/completions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseCodes: nextCodes })
        });
        return next;
      });
    },
    [dashboard]
  );

  if (bootError) {
    return (
      <main className="mx-auto max-w-lg px-6 py-12">
        <h1 className="text-2xl font-bold text-slate-900">Couldn&apos;t load dashboard</h1>
        <p className="mt-3 text-slate-600">{bootError}</p>
        <button
          type="button"
          className="mt-6 rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800"
          onClick={() => window.location.reload()}
        >
          Refresh page
        </button>
      </main>
    );
  }

  if (!ready) {
    return <main className="mx-auto max-w-5xl px-6 py-12">Loading dashboard…</main>;
  }

  const focusLabel = trackLabelForValue(profile.major, profile.majorTrack);

  if (!dashboard) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold">No Profile Found</h1>
        <p className="mt-2 text-slate-600">Complete onboarding first to generate your personalized dashboard.</p>
        <Link href="/onboarding" className="mt-5 inline-block rounded bg-blue-700 px-4 py-2 text-white">
          Go to Onboarding
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
        <h1 className="text-3xl font-bold text-blue-900">UVA Sage: {profile.major} Dashboard</h1>
        {focusLabel && (
          <p className="mt-1 text-sm font-medium text-blue-900/90">Focus: {focusLabel}</p>
        )}
        <p className="mt-2 text-blue-800">Personalized recommendations based on your goals and interests.</p>
        {apiError && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            Could not load live catalog: {apiError}. Showing sample data where available.
          </p>
        )}
        {apiHint && !apiError && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{apiHint}</p>
        )}
      </div>

      <div
        className="mb-6 -mx-1 overflow-x-auto border-b border-slate-200 pb-px"
        role="tablist"
        aria-label="Dashboard sections"
      >
        <div className="flex min-w-0 flex-nowrap gap-1 px-1 sm:flex-wrap sm:gap-2">
          {DASHBOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              className={`shrink-0 whitespace-nowrap rounded-t-lg border border-b-0 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
                activeTab === tab.id
                  ? "relative bottom-[-1px] border-slate-200 bg-white text-blue-900"
                  : "border-transparent bg-slate-100/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "required" && (
        <section
          id="panel-required"
          role="tabpanel"
          aria-labelledby="tab-required"
          className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 className="text-2xl font-semibold text-slate-900">Required Courses for Your Major</h2>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
            Check off courses you have already completed. Progress is stored in this browser and carries over if you
            change major or track (overlapping course codes stay marked).{" "}
            {completionsAccountSync
              ? "You are signed in — completions also sync to your Supabase account."
              : "Sign in with Supabase Auth to sync the same list to your account across devices."}
          </p>
          {dashboard.majorRequirements.length === 0 ? (
            <div className="mt-4">
              <EmptyState message="No required courses are available for this major in the current sample dataset yet." />
            </div>
          ) : (
            <div className="mt-4 grid gap-6 md:grid-cols-2 md:items-start">
              <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Still to Take</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {requirementsSplit.remaining.length} course
                  {requirementsSplit.remaining.length === 1 ? "" : "s"} remaining — scroll inside this panel.
                </p>
                <div className="mt-3 max-h-[min(50vh,26rem)] min-h-[10rem] overflow-y-auto overscroll-contain rounded-md border border-slate-100 bg-white/80 p-2 pr-1">
                  {requirementsSplit.remaining.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-900">
                      All listed requirements are marked complete — nice work.
                    </p>
                  ) : (
                    <CourseGridThreeColumns
                      courses={requirementsSplit.remaining}
                      renderItem={(course) => (
                        <RequirementCourseCard
                          course={course}
                          checked={false}
                          onToggle={toggleRequirementCompleted}
                          onOpenDetails={(c) => openCourseDetail(c)}
                        />
                      )}
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Already Taken</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {requirementsSplit.completed.length} course
                  {requirementsSplit.completed.length === 1 ? "" : "s"} marked complete — separate scroll below.
                </p>
                <div className="mt-3 max-h-[min(50vh,26rem)] min-h-[10rem] overflow-y-auto overscroll-contain rounded-md border border-slate-100 bg-white/80 p-2 pr-1">
                  {requirementsSplit.completed.length === 0 ? (
                    <p className="p-2 text-sm text-slate-500">
                      No courses checked yet — use the checkboxes in &quot;Still to Take&quot; as you finish classes.
                    </p>
                  ) : (
                    <CourseGridThreeColumns
                      courses={requirementsSplit.completed}
                      renderItem={(course) => (
                        <RequirementCourseCard
                          course={course}
                          checked
                          onToggle={toggleRequirementCompleted}
                          onOpenDetails={(c) => openCourseDetail(c)}
                        />
                      )}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === "engineering" && (
        <div id="panel-engineering" role="tabpanel" aria-labelledby="tab-engineering">
          <WidePanel title="Recommended Engineering Courses" description={engineeringTabDescription}>
            {dashboard.recommendedCourses.length === 0 ? (
              <EmptyState message="No engineering course recommendations are available yet for this profile. Add goals on your profile page." />
            ) : (
              <div className="space-y-8">
                {engineeringSections.length > 1 ? (
                  <nav
                    className="flex flex-wrap gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 sm:p-4"
                    aria-label="Jump to course categories"
                  >
                    {engineeringSections.map((section) => {
                      const st = getElectiveSectionVisual(section.id);
                      return (
                        <a
                          key={section.id}
                          href={`#${engineeringSectionAnchorId(section.id)}`}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${st.accentBar}`}
                            aria-hidden
                          />
                          {st.shortNavLabel}
                        </a>
                      );
                    })}
                  </nav>
                ) : null}
                {engineeringSections.map((section, sectionIdx) => {
                  const st = getElectiveSectionVisual(section.id);
                  const sectionCount = section.subsections.reduce((n, s) => n + s.items.length, 0);
                  return (
                    <section
                      key={section.id}
                      id={engineeringSectionAnchorId(section.id)}
                      className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/[0.06] ring-1 ring-slate-900/[0.04]"
                    >
                      <header
                        className={`relative border-b border-slate-100/90 bg-gradient-to-r ${st.headerGradient}`}
                      >
                        <div className="flex gap-0">
                          <div className={`w-1.5 shrink-0 sm:w-2 ${st.accentBar}`} aria-hidden />
                          <div className="flex min-w-0 flex-1 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:gap-4 sm:px-6 sm:py-5">
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ring-1 ${st.badgeClass}`}
                            >
                              {sectionIdx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                                {section.title}
                              </h3>
                              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600">
                                {section.description}
                              </p>
                            </div>
                            <p className="shrink-0 rounded-full border border-slate-200/90 bg-white/90 px-3 py-1 text-center text-xs font-medium text-slate-600 shadow-sm sm:mt-1">
                              {sectionCount} course{sectionCount === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                      </header>
                      <div className="space-y-5 bg-slate-50/60 px-4 py-5 sm:px-6 sm:py-6">
                        {section.subsections.map((sub, subIdx) => (
                          <div
                            key={`${section.id}-${sub.key}`}
                            className={subIdx > 0 ? "mt-6 border-t border-slate-200/80 pt-6" : ""}
                          >
                            {sub.title ? (
                              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                                <span
                                  className={`h-2 w-2 shrink-0 rounded-full ${st.accentBar}`}
                                  aria-hidden
                                />
                                {sub.title}
                              </h4>
                            ) : null}
                            <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
                              <CourseGridThreeColumns
                                courses={sub.items.map((r) => r.item)}
                                renderItem={(course) => (
                                  <RecommendedCourseCell
                                    variant="engineering"
                                    course={course}
                                    onOpenDetails={(c) =>
                                      openCourseDetail(
                                        c,
                                        engineeringReasonByCode.get(
                                          c.code.trim().replace(/\s+/g, " ").toUpperCase()
                                        )
                                      )
                                    }
                                  />
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </WidePanel>
        </div>
      )}

      {activeTab === "research" && (
        <div id="panel-research" role="tabpanel" aria-labelledby="tab-research">
          <WidePanel
            title="Research Matches"
            description="Programs and postings aligned with your stated research interests. Update your profile if you want a different mix."
          >
            {dashboard.researchMatches.length === 0 ? (
              <EmptyState message="No research matches were found yet. Add more detail under research goals in your profile." />
            ) : (
              dashboard.researchMatches.map(({ item, reason }) => (
                <article
                  key={`${item.title}-${item.link}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6"
                >
                  <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.department}</p>
                  <p className="mt-3 max-w-4xl text-base leading-relaxed text-slate-700">{item.description}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.eligibility}</p>
                  <p className="mt-3 text-sm font-medium text-blue-800">{reason}</p>
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex text-sm font-medium text-blue-700 underline-offset-2 hover:underline"
                    >
                      Open link
                    </a>
                  ) : null}
                </article>
              ))
            )}
          </WidePanel>
        </div>
      )}

      {activeTab === "internship" && (
        <div id="panel-internship" role="tabpanel" aria-labelledby="tab-internship">
          <WidePanel
            title="Internship Matches"
            description="Opportunities scored against your internship goals and related keywords from your profile."
          >
            {dashboard.internshipMatches.length === 0 ? (
              <EmptyState message="No internship matches were found yet. Expand your internship goals in your profile." />
            ) : (
              dashboard.internshipMatches.map(({ item, reason }) => (
                <article
                  key={`${item.title}-${item.link}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6"
                >
                  <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.department}</p>
                  <p className="mt-3 max-w-4xl text-base leading-relaxed text-slate-700">{item.description}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.eligibility}</p>
                  <p className="mt-3 text-sm font-medium text-blue-800">{reason}</p>
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex text-sm font-medium text-blue-700 underline-offset-2 hover:underline"
                    >
                      Open link
                    </a>
                  ) : null}
                </article>
              ))
            )}
          </WidePanel>
        </div>
      )}

      {activeTab === "studyAbroad" && (
        <div id="panel-studyAbroad" role="tabpanel" aria-labelledby="tab-studyAbroad">
          <WidePanel
            title="UVA Study Abroad Programs"
            description={
              <>
                Programs from the{" "}
                <a
                  href="https://educationabroad.virginia.edu/uva-programs"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-blue-700 underline-offset-2 hover:underline"
                >
                  Education Abroad UVA Programs
                </a>{" "}
                listing, ranked against your study abroad interests (and optional keywords) from your profile.
                {profileLooksEngineeringMajor(profile.major) ? (
                  <>
                    {" "}
                    <span className="font-medium text-slate-700">
                      Engineering majors get a boost for ISO programs titled around engineering, technology practice,
                      DGIST, or the TU Dortmund exchange.
                    </span>
                  </>
                ) : null}{" "}
                Cards show a short summary of each program&apos;s brochure text; open a card for the full description,
                subject areas, and ISO link. Course titles change by term—confirm details on each program&apos;s Academics
                tab.
              </>
            }
          >
            {!profileHasStudyAbroadSignals(profile) && !profileLooksEngineeringMajor(profile.major) ? (
              <EmptyState message="Add study abroad interests on your profile to personalize these suggestions." />
            ) : dashboard.studyAbroadProgramMatches.length === 0 ? (
              <EmptyState message="No programs to show. Try choosing more interests (region, language, term, or subjects) or optional keywords on your profile." />
            ) : (
              <>
                {profileLooksEngineeringMajor(profile.major) && !profileHasStudyAbroadSignals(profile) ? (
                  <p className="mb-5 rounded-lg border border-blue-100 bg-blue-50/90 p-4 text-sm leading-relaxed text-blue-950">
                    Add study abroad interests on your profile for better keyword matching. Until then, Sage still surfaces
                    programs that are especially relevant for engineering students.
                  </p>
                ) : null}
                <CatalogGridThreeColumns
                  items={dashboard.studyAbroadProgramMatches}
                  getKey={(m, index) => `${m.item.id}-${index}`}
                  renderItem={(m) => (
                    <StudyAbroadProgramCell
                      program={m.item}
                      onOpenDetails={() => setStudyAbroadModal({ program: m.item, reason: m.reason })}
                    />
                  )}
                />
              </>
            )}
          </WidePanel>
        </div>
      )}

      {activeTab === "outside" && (
        <div id="panel-outside" role="tabpanel" aria-labelledby="tab-outside">
          <WidePanel
            title="Beyond Engineering"
            description="Non-engineering courses from the catalog matched to your outside-of-engineering interest choices. Update interests on your profile to explore new areas."
          >
            {dashboard.outsideEngineeringMatches.length === 0 ? (
              <EmptyState message="No suggestions yet. Choose interests under “Interests Outside Engineering” on your profile." />
            ) : (
              <CourseGridThreeColumns
                courses={dashboard.outsideEngineeringMatches.map((r) => r.item)}
                renderItem={(course, index) => (
                  <RecommendedCourseCell
                    course={course}
                    onOpenDetails={(c) =>
                      openCourseDetail(c, dashboard.outsideEngineeringMatches[index]?.reason)
                    }
                  />
                )}
              />
            )}
          </WidePanel>
        </div>
      )}

      {activeTab === "discovery" && (
        <div id="panel-discovery" role="tabpanel" aria-labelledby="tab-discovery">
          <WidePanel
            title="Course Discovery Tools"
            description="Official and widely used UVA tools for browsing schedules, registering, and exploring departments beyond what Sage auto-matches."
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <a
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-4 text-base font-medium text-slate-900 shadow-sm transition hover:bg-slate-50"
                href="https://hooslist.virginia.edu/"
                target="_blank"
                rel="noreferrer"
              >
                Hoos&apos; List
              </a>
              <a
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-4 text-base font-medium text-slate-900 shadow-sm transition hover:bg-slate-50"
                href="https://sisuva.admin.virginia.edu/psp/ihprd/EMPLOYEE/SA/c/SA_LEARNER_SERVICES.CLASS_SEARCH.GBL"
                target="_blank"
                rel="noreferrer"
              >
                UVA SIS Class Search
              </a>
              <a
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-4 text-base font-medium text-slate-900 shadow-sm transition hover:bg-slate-50"
                href="https://engineering.virginia.edu/departments"
                target="_blank"
                rel="noreferrer"
              >
                UVA Engineering Departments
              </a>
            </div>
          </WidePanel>
        </div>
      )}

      <CourseDetailModal
        course={courseModal?.course ?? null}
        reason={courseModal?.reason}
        open={courseModal !== null}
        onClose={() => setCourseModal(null)}
      />
      <StudyAbroadProgramModal
        program={studyAbroadModal?.program ?? null}
        reason={studyAbroadModal?.reason}
        open={studyAbroadModal !== null}
        onClose={() => setStudyAbroadModal(null)}
      />
    </main>
  );
}
