import { HomeCtaButtons } from "@/components/HomeCtaButtons";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="font-display text-sm font-semibold uppercase tracking-widest text-orange-600">
          UVA Sage
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
          Build Your Personalized Academic and Opportunity Dashboard
        </h1>
        <p className="mt-4 text-slate-700">
          Answer a few questions about your major, goals, and interests. We will curate required classes
          and high-fit opportunities across research, internships, study abroad, and beyond.
        </p>
        <HomeCtaButtons />
      </div>
    </main>
  );
}
