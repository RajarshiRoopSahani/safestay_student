
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Camera,
  CheckCircle2,
  GitCompare,
  MapPin,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import SearchBar from "@/components/SearchBar";

const examples = [
  "Lucknow",
  "Aliganj",
  "Gomti Nagar",
  "Deoria",
  "Jaunpur",
  "Near Engineering College",
];

const areas = [
  { name: "Aliganj", city: "Lucknow", number: "01" },
  { name: "Gomti Nagar", city: "Lucknow", number: "02" },
  { name: "Deoria", city: "Deoria", number: "03" },
  { name: "Jaunpur", city: "Jaunpur", number: "04" },
];

const features = [
  {
    Icon: Camera,
    number: "01",
    title: "Real student photos",
    text: "Explore community-shared photos to get a better idea of property conditions.",
  },
  {
    Icon: Star,
    number: "02",
    title: "Honest reviews",
    text: "Make informed decisions with student reviews and available ratings.",
  },
  {
    Icon: GitCompare,
    number: "03",
    title: "Compare properties",
    text: "Compare rents, facilities and other details before making your choice.",
  },
  {
    Icon: Bot,
    number: "04",
    title: "Smart AI assistant",
    text: "Get help exploring accommodation options using everyday language.",
  },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-white text-slate-900">
      <section className="relative isolate border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-teal-50/70">
        <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-teal-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 -z-10 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/90 px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              Your next chapter starts here
            </div>

            <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Find a place to stay.
              <span className="block text-teal-700">
                Find a place to belong.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Discover student hostels, PGs and rooms near your college.
              Compare prices, explore student photos and choose your next
              home with confidence.
            </p>

            <div className="mx-auto mt-9 max-w-3xl rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60 sm:p-3">
              <SearchBar size="lg" />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="mr-1 text-sm font-medium text-slate-500">
                Popular searches
              </span>
              {examples.map((example) => (
                <Link
                  key={example}
                  href={`/search?q=${encodeURIComponent(example)}`}
                  className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
                >
                  {example}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-700" />
                Compare accommodation
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-700" />
                Explore student reviews
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-700" />
                Make informed choices
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">
              Explore locations
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Find your neighbourhood
            </h2>
            <p className="mt-3 max-w-xl leading-7 text-slate-600">
              Start with a location and discover accommodation options around
              your preferred area.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex w-fit items-center gap-2 font-semibold text-teal-800 transition hover:text-teal-950"
          >
            Explore all properties <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {areas.map((area) => (
            <Link
              key={area.name}
              href={`/search?q=${encodeURIComponent(area.name)}`}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-200/50"
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex rounded-xl bg-teal-50 p-3 text-teal-800 transition group-hover:bg-teal-700 group-hover:text-white">
                  <MapPin className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold tracking-widest text-slate-300">
                  {area.number}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-bold text-slate-900">
                {area.name}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{area.city}</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-teal-800">
                Explore area
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50/80">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">
              The SafeStay difference
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              More clarity. Better decisions.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              The details that help you make a more informed accommodation
              choice, all in one place.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ Icon, number, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 transition hover:border-teal-200 hover:shadow-lg hover:shadow-slate-200/40"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-xl bg-teal-50 p-3 text-teal-800">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-bold tracking-widest text-slate-300">
                    {number}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-center sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative">
            <span className="mx-auto inline-flex rounded-2xl border border-white/10 bg-white/10 p-3 text-teal-300">
              <Search className="h-6 w-6" />
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your next home deserves a closer look.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">
              Explore available details, check the property in person and
              understand the rental terms before making a payment.
            </p>
            <Link
              href="/search"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 py-3.5 font-bold text-slate-950 transition hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Explore accommodation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
