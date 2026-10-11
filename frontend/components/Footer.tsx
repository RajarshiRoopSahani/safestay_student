import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
            <span className="font-bold text-slate-900">SafeStay Student</span>
          </div>
          <p className="mt-2 text-sm font-medium text-indigo-600">Find Better. Stay Safer.</p>
          <p className="mt-3 text-sm text-slate-500">
            Search student accommodation with real community photos and honest reviews.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/search" className="hover:text-indigo-600">Search properties</Link></li>
            <li><Link href="/compare" className="hover:text-indigo-600">Compare rents</Link></li>
            <li><Link href="/chat" className="hover:text-indigo-600">SafeStay AI</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900">Good to know</h4>
          <p className="mt-3 text-sm text-slate-500">
            Photos and reviews are shared by students and may not show current conditions. Always visit and verify a
            property in person before booking or paying.
          </p>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} SafeStay Student · College project · Demo data is fictional
      </div>
    </footer>
  );
}
