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
import type { ProfileGetResponse } from "@/lib/saved-profile";
import { stripToSavedPayload } from "@/lib/saved-profile";
import {
  isLikelyUvaEmail,
  normalizeUvaEmail,
  UVA_QUICK_LOGIN_EMAIL_KEY
} from "@/lib/quick-login-email";
import { parseStoredProfile } from "@/lib/student-profile";
import type { StudentProfileInput } from "@/types/domain";

function defaultForm(): StudentProfileInput {
  return {
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

function shouldSkipUvaEmailGate(args: {
  serverSavedProfile: boolean;
  localRaw: string | null;
}): boolean {
  if (args.serverSavedProfile) return true;
  if (!args.localRaw) return false;
  try {
    const p = parseStoredProfile(args.localRaw);
    if (p.onboardingCompleted === true) return true;
    if (p.major?.trim() && p.graduationYear?.trim()) return true;
  } catch {
    return false;
  }
  return false;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState<StudentProfileInput>(() => defaultForm());
  const [hydrated, setHydrated] = useState(false);
  const [showUvaEmailStep, setShowUvaEmailStep] = useState(false);
  const [uvaEmailInput, setUvaEmailInput] = useState("");
  const [uvaEmailError, setUvaEmailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let serverSaved = false;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = (await res.json()) as ProfileGetResponse;
          if (cancelled) return;
          if (data.saved === true) {
            serverSaved = true;
            setForm({
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
      const skipEmail = shouldSkipUvaEmailGate({ serverSavedProfile: serverSaved, localRaw: raw });

      if (!serverSaved && raw) {
        try {
          const p = parseStoredProfile(raw);
          if (p.major) {
            setForm({
              uvaEmail: p.uvaEmail,
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

      if (!cancelled) {
        setShowUvaEmailStep(!skipEmail);
        if (!skipEmail) {
          const quick = localStorage.getItem(UVA_QUICK_LOGIN_EMAIL_KEY);
          setUvaEmailInput(quick ?? "");
        }
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const continuePastUvaEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setUvaEmailError(null);
    const trimmed = uvaEmailInput.trim();
    if (!trimmed) {
      setUvaEmailError("Enter your UVA email.");
      return;
    }
    if (!isLikelyUvaEmail(trimmed)) {
      setUvaEmailError("Use your UVA email address (ending in @virginia.edu).");
      return;
    }
    const normalized = normalizeUvaEmail(trimmed);
    localStorage.setItem(UVA_QUICK_LOGIN_EMAIL_KEY, normalized);
    setForm((prev) => ({ ...prev, uvaEmail: normalized }));
    setShowUvaEmailStep(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    let completedCourseCodes: string[] = [];
    const raw = localStorage.getItem("uvaProfile");
    if (raw) {
      try {
        completedCourseCodes = parseStoredProfile(raw).completedCourseCodes ?? [];
      } catch {
        /* ignore */
      }
    }
    const quick = localStorage.getItem(UVA_QUICK_LOGIN_EMAIL_KEY);
    const resolvedUvaEmail =
      form.uvaEmail?.trim() || (quick ? normalizeUvaEmail(quick) : undefined);
    const stored: StudentProfileInput = {
      ...form,
      uvaEmail: resolvedUvaEmail,
      onboardingCompleted: true,
      outsideInterestDetails: pruneOutsideInterestDetails(
        form.outsideInterests,
        form.outsideInterestDetails ?? []
      ),
      completedCourseCodes
    };
    localStorage.setItem("uvaProfile", JSON.stringify(stored));

    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stripToSavedPayload(stored))
      });
    } catch {
      /* still saved locally */
    }

    router.push("/dashboard");
  };

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-slate-600">Loading your profile…</p>
      </main>
    );
  }

  if (showUvaEmailStep) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Your Profile</h1>
        <p className="mt-2 text-slate-600">
          First, confirm your UVA email so we can tie your plan to the right identity in this browser.
        </p>
        <form
          onSubmit={continuePastUvaEmail}
          className="mt-8 max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <label className="block">
            <span className="font-medium text-slate-800">UVA email</span>
            <input
              type="email"
              autoComplete="email"
              className="mt-2 w-full rounded-md border border-slate-300 p-2"
              placeholder="you@virginia.edu"
              value={uvaEmailInput}
              onChange={(e) => setUvaEmailInput(e.target.value)}
            />
          </label>
          {uvaEmailError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{uvaEmailError}</p>
          ) : null}
          <button
            type="submit"
            className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Continue to profile questions
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-500">
          <Link href="/dashboard" className="font-medium text-blue-700 hover:underline">
            Back to Dashboard
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Your Profile</h1>
      <p className="mt-2 text-slate-600">
        Tell us about your major and goals. Come back here anytime to update — changes save to this browser, and to your
        account when you&apos;re signed in.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        <Link href="/dashboard" className="font-medium text-blue-700 hover:underline">
          Back to Dashboard
        </Link>
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="font-medium text-slate-800">Major</span>
          <select
            className="mt-2 w-full rounded-md border border-slate-300 p-2"
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
          <label className="block">
            <span className="font-medium text-slate-800">{trackConfig.sectionTitle}</span>
            {trackConfig.helpText && (
              <p className="mt-1 text-sm text-slate-600">{trackConfig.helpText}</p>
            )}
            <select
              className="mt-2 w-full rounded-md border border-slate-300 p-2"
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

        <label className="block">
          <span className="font-medium text-slate-800">Expected Graduation Year</span>
          <input
            className="mt-2 w-full rounded-md border border-slate-300 p-2"
            value={form.graduationYear}
            onChange={(e) => update("graduationYear", e.target.value)}
            placeholder="2029"
          />
        </label>

        <label className="block">
          <span className="font-medium text-slate-800">Research Goals</span>
          <textarea
            className="mt-2 w-full rounded-md border border-slate-300 p-2"
            rows={3}
            value={form.researchGoal}
            onChange={(e) => update("researchGoal", e.target.value)}
            placeholder="Example: AI, robotics, renewable energy systems"
          />
        </label>

        <label className="block">
          <span className="font-medium text-slate-800">Internship Goals</span>
          <textarea
            className="mt-2 w-full rounded-md border border-slate-300 p-2"
            rows={3}
            value={form.internshipGoal}
            onChange={(e) => update("internshipGoal", e.target.value)}
            placeholder="Example: startup experience, product management, embedded systems"
          />
        </label>

        <fieldset className="min-w-0">
          <legend className="font-medium text-slate-800">Study Abroad Interests</legend>
          <p className="mt-1 text-sm text-slate-600">
            Open each area and tap options that fit you. Choices align with keywords on UVA Education Abroad programs so
            your Study Abroad tab can rank suggestions. After you pick one or more{" "}
            <span className="font-medium text-slate-800">Regions</span>, the Countries &amp; hubs list narrows to match.
          </p>
          {(form.studyAbroadInterests?.length ?? 0) > 0 && (
            <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50/80 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-teal-900/80">Selected interests</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(form.studyAbroadInterests ?? []).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleStudyAbroadInterest(value)}
                    className="rounded-full bg-teal-700 px-3 py-1 text-sm font-medium text-white hover:bg-teal-800"
                  >
                    {studyAbroadInterestLabel(value)}
                    <span className="ml-1 opacity-80">×</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 space-y-2">
            {studyAbroadSections.map((section) => {
              const isCountriesSection = section.heading.startsWith("Countries & hubs");
              return (
                <details
                  key={isCountriesSection ? "study-abroad-countries" : section.heading}
                  className="group rounded-lg border border-slate-200 bg-slate-50/50 [&_summary::-webkit-details-marker]:hidden open:bg-white"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100/80">
                    {section.heading}
                    <span className="text-slate-400 transition group-open:rotate-180">▼</span>
                  </summary>
                  <div className="border-t border-slate-200 px-3 py-3">
                    {isCountriesSection && section.options.length === 0 ? (
                      <p className="text-sm leading-relaxed text-slate-600">
                        No sample country hubs are mapped for only this combination of regions. Add another region,
                        choose a different mix, or use Additional keywords below.
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
                              className={`rounded-full border px-3 py-1.5 text-left text-sm font-medium transition-colors ${
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
          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">Additional keywords (optional)</span>
            <input
              className="mt-2 w-full rounded-md border border-slate-300 p-2 text-sm"
              value={form.studyAbroadGoal}
              onChange={(e) => update("studyAbroadGoal", e.target.value)}
              placeholder="e.g. specific city, minor, or niche topic"
            />
          </label>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="font-medium text-slate-800">Interests Outside Engineering</legend>
          <p className="mt-1 text-sm text-slate-600">
            Open each area and tap options that fit you. Choices personalize non-engineering course ideas on your
            dashboard.
          </p>
          {(form.outsideInterests.length > 0 || (form.outsideInterestDetails?.length ?? 0) > 0) && (
            <div className="mt-3 space-y-3 rounded-lg border border-blue-200 bg-blue-50/80 p-3">
              {form.outsideInterests.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-900/80">Broad areas</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.outsideInterests.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleOutsideInterest(value)}
                        className="rounded-full bg-blue-700 px-3 py-1 text-sm font-medium text-white hover:bg-blue-800"
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
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-900/80">Personal refinements</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(form.outsideInterestDetails ?? []).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleOutsideInterestDetail(value)}
                        className="rounded-full border-2 border-blue-800 bg-white px-3 py-1 text-sm font-medium text-blue-900 hover:bg-blue-100"
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
          <div className="mt-4 space-y-2">
            {OUTSIDE_INTEREST_SECTIONS.map((section) => (
              <details
                key={section.heading}
                className="group rounded-lg border border-slate-200 bg-slate-50/50 [&_summary::-webkit-details-marker]:hidden open:bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100/80">
                  {section.heading}
                  <span className="text-slate-400 transition group-open:rotate-180">▼</span>
                </summary>
                <div className="flex flex-wrap gap-2 border-t border-slate-200 px-3 py-3">
                  {section.options.map((opt) => {
                    const selected = form.outsideInterests.some((x) => x.toLowerCase() === opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleOutsideInterest(opt.value)}
                        className={`rounded-full border px-3 py-1.5 text-left text-sm font-medium transition-colors ${
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
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="font-medium text-slate-800">Personalize Your Outside Interests</legend>
          <p className="mt-1 text-sm text-slate-600">
            After you choose broad areas above, optional follow-ups appear here — same format, a bit more specific so
            course suggestions can feel closer to what you care about.
          </p>
          {outsideFollowUpBlocks.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
              Select at least one option under &quot;Interests Outside Engineering&quot; to unlock questions tailored to
              those areas.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {outsideFollowUpBlocks.map((block) => (
                <details
                  key={block.parentHeading}
                  className="group rounded-lg border border-slate-200 bg-slate-50/50 [&_summary::-webkit-details-marker]:hidden open:bg-white"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100/80">
                    <span>
                      <span className="text-slate-500">{block.parentHeading}</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      {block.heading}
                    </span>
                    <span className="text-slate-400 transition group-open:rotate-180">▼</span>
                  </summary>
                  <div className="flex flex-wrap gap-2 border-t border-slate-200 px-3 py-3">
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
                          className={`rounded-full border px-3 py-1.5 text-left text-sm font-medium transition-colors ${
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
        </fieldset>

        <button
          type="submit"
          className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
        >
          Save and Go to Dashboard
        </button>
      </form>
    </main>
  );
}
