import { HomeCtaButtons } from "@/components/HomeCtaButtons";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="rounded-2xl border border-sky-200/70 bg-white/90 p-8 shadow-lg shadow-sky-900/10 backdrop-blur-sm">
        <p className="font-display text-sm font-semibold uppercase tracking-widest text-orange-600">
          UVA Sage
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
          Build your personalized academic and opportunity dashboard
        </h1>
        <p className="mt-4 text-slate-700">
          Answer a few questions about your major, goals, and interests. We surface degree requirements and
          opportunities that fit you across research, internships, study abroad, and more.
        </p>
        <HomeCtaButtons />
      </div>
    </main>
  );
}
