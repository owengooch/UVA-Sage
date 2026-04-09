"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { defaultMajorTrackForMajor, ENGINEERING_MAJORS, getTrackConfig } from "@/lib/major-tracks";
import {
  followUpBlocksForSelections,
  OUTSIDE_INTEREST_SECTIONS,
  outsideInterestLabel,
  pruneOutsideInterestDetails
} from "@/lib/outside-interest-options";
import {
  buildStudyAbroadInterestSections,
  studyAbroadInterestLabel
} from "@/lib/study-abroad-interest-options";
import { isAllowedUvaEmail, uvaEmailHint } from "@/lib/auth/uva-email";
import { fetchProfileForBrowserClient, putProfileForBrowserClient } from "@/lib/fetch-profile-client";
import { stripToSavedPayload } from "@/lib/saved-profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { parseStoredProfile } from "@/lib/student-profile";
import type { StudentProfileInput } from "@/types/domain";

function defaultForm(): StudentProfileInput {
  return {
    uvaEmail: "",
    major: ENGINEERING_MAJORS[0],
    majorTrack: defaultMajorTrackForMajor(ENGINEERING_MAJORS[0]),
    graduationYear: "2029",
    researchGoal: "",
    internshipGoal: "",
    studyAbroadGoal: "",
    studyAbroadInterests: [],
    outsideInterests: [],
    outsideInterestDetails: []
  };
}

const STEPS = [
  { id: "email", short: "Email", title: "Your UVA email", hint: "We use this to tie your plan to your UVA identity." },
  {
    id: "program",
    short: "Program",
    title: "Major, focus, and graduation",
    hint: "Tell us your engineering program and when you expect to finish."
  },
  { id: "research", short: "Research", title: "Research goals", hint: "What kinds of research or technical depth interest you?" },
  {
    id: "internship",
    short: "Internship",
    title: "Internship goals",
    hint: "What work experience or industries are you aiming for?"
  },
  {
    id: "abroad",
    short: "Study abroad",
    title: "Study abroad interests",
    hint: "Optional chips and keywords that help match Education Abroad programs."
  },
  {
    id: "outside",
    short: "Beyond engineering",
    title: "Interests outside engineering",
    hint: "Broad areas that shape non-engineering course ideas on your dashboard."
  },
  {
    id: "refine",
    short: "Refine",
    title: "Refine your interests",
    hint: "Optional follow-ups when you picked broad areas above—they sharpen recommendations."
  }
] as const;

type StepId = (typeof STEPS)[number]["id"];

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState<StudentProfileInput>(() => defaultForm());
  const [hydrated, setHydrated] = useState(false);
  const [sessionOk, setSessionOk] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.replace("/");
        return;
      }
      setSessionOk(true);
    });
  }, [router]);

  useEffect(() => {
    if (!sessionOk) return;
    let cancelled = false;
    let serverSaved = false;
    (async () => {
      try {
        const { ok, data } = await fetchProfileForBrowserClient();
        if (ok && data) {
          if (cancelled) return;
          if (data.saved === true) {
            serverSaved = true;
            setForm({
              sageUsername: data.sageUsername,
              uvaEmail: data.uvaEmail ?? "",
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
              onboardingCompleted: true
            });
          }
        }
      } catch {
        /* use local fallback */
      }

      if (cancelled) return;

      const raw = localStorage.getItem("uvaProfile");
      if (!serverSaved && raw) {
        try {
          const p = parseStoredProfile(raw);
          if (p.major) {
            setForm({
              sageUsername: p.sageUsername,
              uvaEmail: p.uvaEmail ?? "",
              onboardingCompleted: p.onboardingCompleted,
              major: p.major,
              majorTrack: p.majorTrack ?? defaultMajorTrackForMajor(p.major),
              graduationYear: p.graduationYear || "2029",
              researchGoal: p.researchGoal ?? "",
              internshipGoal: p.internshipGoal ?? "",
              studyAbroadGoal: p.studyAbroadGoal ?? "",
              studyAbroadInterests: p.studyAbroadInterests ?? [],
              outsideInterests: p.outsideInterests ?? [],
              outsideInterestDetails: pruneOutsideInterestDetails(
                p.outsideInterests ?? [],
                p.outsideInterestDetails ?? []
              ),
              completedCourseCodes: p.completedCourseCodes ?? []
            });
          }
        } catch {
          /* ignore */
        }
      }

      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionOk]);

  const update = (field: keyof StudentProfileInput, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleOutsideInterest = (raw: string) => {
    const token = raw.trim().toLowerCase();
    if (!token) return;
    setForm((prev) => {
      const has = prev.outsideInterests.some((x) => x.toLowerCase() === token);
      if (has) {
        const nextBroad = prev.outsideInterests.filter((x) => x.toLowerCase() !== token);
        return {
          ...prev,
          outsideInterests: nextBroad,
          outsideInterestDetails: pruneOutsideInterestDetails(nextBroad, prev.outsideInterestDetails ?? [])
        };
      }
      return { ...prev, outsideInterests: [...prev.outsideInterests, token] };
    });
  };

  const toggleStudyAbroadInterest = (raw: string) => {
    const token = raw.trim().toLowerCase();
    if (!token) return;
    setForm((prev) => {
      const list = prev.studyAbroadInterests ?? [];
      const has = list.some((x) => x.toLowerCase() === token);
      if (has) {
        return { ...prev, studyAbroadInterests: list.filter((x) => x.toLowerCase() !== token) };
      }
      return { ...prev, studyAbroadInterests: [...list, token] };
    });
  };

  const toggleOutsideInterestDetail = (raw: string) => {
    const token = raw.trim().toLowerCase();
    if (!token) return;
    setForm((prev) => {
      const details = prev.outsideInterestDetails ?? [];
      const has = details.some((x) => x.toLowerCase() === token);
      if (has) {
        return { ...prev, outsideInterestDetails: details.filter((x) => x.toLowerCase() !== token) };
      }
      return { ...prev, outsideInterestDetails: [...details, token] };
    });
  };

  const trackConfig = getTrackConfig(form.major);

  const outsideFollowUpBlocks = useMemo(() => followUpBlocksForSelections(form.outsideInterests), [form.outsideInterests]);

  const studyAbroadSections = useMemo(
    () => buildStudyAbroadInterestSections(form.studyAbroadInterests ?? []),
    [form.studyAbroadInterests]
  );

  const stepId = STEPS[activeStep]?.id as StepId | undefined;
  const lastIndex = STEPS.length - 1;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveError(null);
    const uva = form.uvaEmail?.trim() ?? "";
    if (!isAllowedUvaEmail(uva)) {
      setSaveError(`Enter a valid UVA email. ${uvaEmailHint()}`);
      setActiveStep(0);
      return;
    }
    let completedCourseCodes: string[] = [];
    const raw = localStorage.getItem("uvaProfile");
    if (raw) {
      try {
        completedCourseCodes = parseStoredProfile(raw).completedCourseCodes ?? [];
      } catch {
        /* ignore */
      }
    }
    const stored: StudentProfileInput = {
      ...form,
      uvaEmail: uva.toLowerCase(),
      onboardingCompleted: true,
      outsideInterestDetails: pruneOutsideInterestDetails(
        form.outsideInterests,
        form.outsideInterestDetails ?? []
      ),
      completedCourseCodes
    };
    localStorage.setItem("uvaProfile", JSON.stringify(stored));

    const payload = stripToSavedPayload(stored);
    const result = await putProfileForBrowserClient(payload);
    if (!result.ok) {
      setSaveError(
        result.error ??
          "Could not save to your account. Your answers are kept in this browser — try Save again in a moment."
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const goNext = () => {
    setSaveError(null);
    if (activeStep < lastIndex) setActiveStep((s) => s + 1);
  };

  const goBack = () => {
    setSaveError(null);
    if (activeStep > 0) setActiveStep((s) => s - 1);
  };

  if (!sessionOk || !hydrated) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-slate-600">Loading your profile…</p>
      </main>
    );
  }

  const inputSurface =
    "mt-3 w-full rounded-lg border border-slate-300/90 bg-white px-4 py-3 text-base shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200";
  const textareaSurface = `${inputSurface} min-h-[8rem] resize-y`;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
      <h1 className="text-3xl font-bold text-slate-900 lg:text-4xl">Your profile</h1>
      <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600">
        Answer each step in order, or jump between steps anytime. Changes stay in this browser until you save; when
        you&apos;re signed in, they sync to your account too.
      </p>
      <p className="mt-3 text-sm text-slate-500">
        <Link href="/dashboard" className="font-medium text-blue-700 hover:underline">
          Back to dashboard
        </Link>
      </p>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="mt-10 rounded-2xl border border-sky-200/70 bg-white/90 p-6 shadow-md shadow-sky-900/5 backdrop-blur-sm sm:p-10 lg:p-12"
      >
        <div
          className="flex flex-wrap gap-2 border-b border-sky-200/50 pb-6"
          role="tablist"
          aria-label="Profile steps"
        >
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={activeStep === i}
              id={`onboarding-tab-${s.id}`}
              aria-controls={`onboarding-panel-${s.id}`}
              className={`motion-press-outline rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                activeStep === i
                  ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-900/20"
                  : "border-slate-300/90 bg-white/80 text-slate-700 hover:border-sky-300"
              }`}
              onClick={() => {
                setSaveError(null);
                setActiveStep(i);
              }}
            >
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">{s.short}</span>
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm font-medium text-slate-500">
          Step {activeStep + 1} of {STEPS.length}
        </p>

        <div
          className="mt-8 min-h-[min(32rem,70vh)] space-y-6 lg:min-h-[28rem]"
          role="tabpanel"
          id={stepId ? `onboarding-panel-${stepId}` : undefined}
          aria-labelledby={stepId ? `onboarding-tab-${stepId}` : undefined}
        >
          {stepId === "email" && (
            <div className="space-y-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{STEPS[0].title}</h2>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">{STEPS[0].hint}</p>
              </div>
              <label className="block max-w-2xl">
                <span className="sr-only">Email address</span>
                <p className="text-sm text-slate-600">{uvaEmailHint()}</p>
                <input
                  type="email"
                  autoComplete="email"
                  className={inputSurface}
                  value={form.uvaEmail ?? ""}
                  onChange={(e) => update("uvaEmail", e.target.value)}
                  placeholder="abc2ab@virginia.edu"
                />
              </label>
            </div>
          )}

          {stepId === "program" && (
            <div className="space-y-10">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{STEPS[1].title}</h2>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">{STEPS[1].hint}</p>
              </div>
              <label className="block max-w-2xl">
                <span className="text-base font-medium text-slate-800">Major</span>
                <select
                  className={inputSurface}
                  value={form.major}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      major: v,
                      majorTrack: defaultMajorTrackForMajor(v)
                    }));
                  }}
                >
                  {ENGINEERING_MAJORS.map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
              </label>
              {trackConfig && (
                <label className="block max-w-2xl">
                  <span className="text-base font-medium text-slate-800">{trackConfig.sectionTitle}</span>
                  {trackConfig.helpText && (
                    <p className="mt-2 text-base leading-relaxed text-slate-600">{trackConfig.helpText}</p>
                  )}
                  <select
                    className={inputSurface}
                    value={form.majorTrack ?? ""}
                    onChange={(e) => update("majorTrack", e.target.value)}
                  >
                    {trackConfig.options.map((t) => (
                      <option key={t.value || "__undecided__"} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block max-w-md">
                <span className="text-base font-medium text-slate-800">Expected graduation year</span>
                <input
                  className={inputSurface}
                  value={form.graduationYear}
                  onChange={(e) => update("graduationYear", e.target.value)}
                  placeholder="2029"
                />
              </label>
            </div>
          )}

          {stepId === "research" && (
            <div className="space-y-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{STEPS[2].title}</h2>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">{STEPS[2].hint}</p>
              </div>
              <label className="block max-w-3xl">
                <span className="sr-only">Research goals</span>
                <textarea
                  className={textareaSurface}
                  rows={6}
                  value={form.researchGoal}
                  onChange={(e) => update("researchGoal", e.target.value)}
                  placeholder="Example: AI, robotics, renewable energy systems"
                />
              </label>
            </div>
          )}

          {stepId === "internship" && (
            <div className="space-y-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{STEPS[3].title}</h2>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">{STEPS[3].hint}</p>
              </div>
              <label className="block max-w-3xl">
                <span className="sr-only">Internship goals</span>
                <textarea
                  className={textareaSurface}
                  rows={6}
                  value={form.internshipGoal}
                  onChange={(e) => update("internshipGoal", e.target.value)}
                  placeholder="Example: startup experience, product management, embedded systems"
                />
              </label>
            </div>
          )}

          {stepId === "abroad" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{STEPS[4].title}</h2>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
                  Open each area and choose options that fit you. They align with keywords on UVA Education Abroad
                  programs. After you pick one or more <span className="font-medium text-slate-800">Regions</span>, the
                  countries and hubs list narrows.
                </p>
              </div>
              {(form.studyAbroadInterests?.length ?? 0) > 0 && (
                <div className="max-w-4xl rounded-xl border border-teal-200 bg-teal-50/90 p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-teal-900/80">Selected interests</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(form.studyAbroadInterests ?? []).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleStudyAbroadInterest(value)}
                        className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
                      >
                        {studyAbroadInterestLabel(value)}
                        <span className="ml-1 opacity-80">×</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="max-w-4xl space-y-3">
                {studyAbroadSections.map((section) => {
                  const isCountriesSection = section.heading.startsWith("Countries & hubs");
                  return (
                    <details
                      key={isCountriesSection ? "study-abroad-countries" : section.heading}
                      className="group rounded-xl border border-slate-200/90 bg-slate-50/60 [&_summary::-webkit-details-marker]:hidden open:bg-white"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-base font-semibold text-slate-900 hover:bg-slate-100/80">
                        {section.heading}
                        <span className="text-slate-400 transition group-open:rotate-180">▼</span>
                      </summary>
                      <div className="border-t border-slate-200 px-5 py-4">
                        {isCountriesSection && section.options.length === 0 ? (
                          <p className="text-base leading-relaxed text-slate-600">
                            No country or hub chips are available for just this mix of regions. Add another region,
                            choose a different combination, or use additional keywords below.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {section.options.map((opt) => {
                              const selected = (form.studyAbroadInterests ?? []).some(
                                (x) => x.toLowerCase() === opt.value
                              );
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  aria-pressed={selected}
                                  onClick={() => toggleStudyAbroadInterest(opt.value)}
                                  className={`rounded-full border px-4 py-2 text-left text-sm font-medium transition-colors ${
                                    selected
                                      ? "border-teal-600 bg-teal-600 text-white"
                                      : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
              <label className="block max-w-2xl">
                <span className="text-base font-medium text-slate-800">Additional keywords (optional)</span>
                <input
                  className={inputSurface}
                  value={form.studyAbroadGoal}
                  onChange={(e) => update("studyAbroadGoal", e.target.value)}
                  placeholder="e.g. specific city, minor, or niche topic"
                />
              </label>
            </div>
          )}

          {stepId === "outside" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{STEPS[5].title}</h2>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
                  Open each area and tap options that fit you. Choices personalize non-engineering course ideas on your
                  dashboard.
                </p>
              </div>
              {(form.outsideInterests.length > 0 || (form.outsideInterestDetails?.length ?? 0) > 0) && (
                <div className="max-w-4xl space-y-4 rounded-xl border border-blue-200 bg-blue-50/90 p-5">
                  {form.outsideInterests.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-900/80">Broad areas</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {form.outsideInterests.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => toggleOutsideInterest(value)}
                            className="rounded-full bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                          >
                            {outsideInterestLabel(value)}
                            <span className="ml-1 opacity-80">×</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {(form.outsideInterestDetails?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-900/80">
                        Personal refinements
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(form.outsideInterestDetails ?? []).map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => toggleOutsideInterestDetail(value)}
                            className="rounded-full border-2 border-blue-800 bg-white px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-100"
                          >
                            {outsideInterestLabel(value)}
                            <span className="ml-1 opacity-70">×</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="max-w-4xl space-y-3">
                {OUTSIDE_INTEREST_SECTIONS.map((section) => (
                  <details
                    key={section.heading}
                    className="group rounded-xl border border-slate-200/90 bg-slate-50/60 [&_summary::-webkit-details-marker]:hidden open:bg-white"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-base font-semibold text-slate-900 hover:bg-slate-100/80">
                      {section.heading}
                      <span className="text-slate-400 transition group-open:rotate-180">▼</span>
                    </summary>
                    <div className="flex flex-wrap gap-2 border-t border-slate-200 px-5 py-4">
                      {section.options.map((opt) => {
                        const selected = form.outsideInterests.some((x) => x.toLowerCase() === opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => toggleOutsideInterest(opt.value)}
                            className={`rounded-full border px-4 py-2 text-left text-sm font-medium transition-colors ${
                              selected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {stepId === "refine" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{STEPS[6].title}</h2>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">{STEPS[6].hint}</p>
              </div>
              {outsideFollowUpBlocks.length === 0 ? (
                <p className="max-w-2xl rounded-xl border border-dashed border-slate-300 bg-slate-50/90 px-6 py-5 text-base leading-relaxed text-slate-600">
                  Select at least one option under &quot;Interests outside engineering&quot; to unlock questions tailored to
                  those areas.
                </p>
              ) : (
                <div className="max-w-4xl space-y-3">
                  {outsideFollowUpBlocks.map((block) => (
                    <details
                      key={block.parentHeading}
                      className="group rounded-xl border border-slate-200/90 bg-slate-50/60 [&_summary::-webkit-details-marker]:hidden open:bg-white"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-base font-semibold text-slate-900 hover:bg-slate-100/80">
                        <span className="text-left">
                          <span className="text-slate-500">{block.parentHeading}</span>
                          <span className="mx-1.5 text-slate-300">·</span>
                          {block.heading}
                        </span>
                        <span className="shrink-0 text-slate-400 transition group-open:rotate-180">▼</span>
                      </summary>
                      <div className="flex flex-wrap gap-2 border-t border-slate-200 px-5 py-4">
                        {block.options.map((opt) => {
                          const selected = (form.outsideInterestDetails ?? []).some(
                            (x) => x.toLowerCase() === opt.value
                          );
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => toggleOutsideInterestDetail(opt.value)}
                              className={`rounded-full border px-4 py-2 text-left text-sm font-medium transition-colors ${
                                selected
                                  ? "border-violet-600 bg-violet-600 text-white"
                                  : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {saveError ? (
          <p className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {saveError}
          </p>
        ) : null}

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200/80 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={activeStep === 0}
            className="motion-press-outline order-2 rounded-lg border border-slate-300/90 bg-white px-6 py-3 text-base font-medium text-slate-800 shadow-sm disabled:pointer-events-none disabled:opacity-40 sm:order-1"
          >
            Back
          </button>
          <div className="order-1 flex flex-col gap-3 sm:order-2 sm:flex-row sm:gap-3">
            {activeStep < lastIndex ? (
              <button
                type="button"
                onClick={goNext}
                className="motion-press-primary rounded-lg bg-blue-700 px-8 py-3 text-base font-semibold text-white shadow-md shadow-blue-900/20 hover:bg-blue-800"
              >
                Next step
              </button>
            ) : (
              <button
                type="submit"
                className="motion-press-primary rounded-lg bg-blue-700 px-8 py-3 text-base font-semibold text-white shadow-md shadow-blue-900/20 hover:bg-blue-800"
              >
                Save and go to dashboard
              </button>
            )}
          </div>
        </div>
      </form>
    </main>
  );
}
