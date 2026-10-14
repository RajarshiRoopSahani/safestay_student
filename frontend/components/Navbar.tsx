
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarCheck,
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  ShieldCheck,
  User as UserIcon,
  X,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const mainLinks = [
  { href: "/search", label: "Find a stay" },
  { href: "/compare", label: "Compare" },
  { href: "/chat", label: "SafeStay AI" },
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (href: string) =>
    `rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
      pathname === href || pathname.startsWith(`${href}/`)
        ? "bg-teal-50 text-teal-800"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
    }`;

  function handleLogout() {
    logout();
    setMenuOpen(false);
    setMobileOpen(false);
    router.push("/");
  }

  const accountLinks = [
    { href: "/favorites", label: "Favorites", icon: Heart },
    { href: "/bookings", label: "My bookings", icon: CalendarCheck },
    { href: "/profile", label: "My profile", icon: UserIcon },
    ...(user?.role === "ADMIN"
      ? [{ href: "/admin", label: "Admin panel", icon: ShieldCheck }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-900/[0.02] backdrop-blur-xl">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          onClick={() => setMobileOpen(false)}
        >
          
<span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden">
  <Image
    src="/logo.png"
    alt="SafeStay Logo"
    width={48}
    height={48}
    priority
    className="h-full w-full object-contain"
  />
</span>

          <span className="flex flex-col">
            <span className="text-lg font-extrabold leading-5 tracking-tight text-slate-950">
              SafeStay
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.19em] text-teal-700">
              Student living
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(link.href)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50/50"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-teal-800">
                  <UserIcon className="h-4 w-4" />
                </span>
                <span className="max-w-24 truncate">
                  {user.name.split(" ")[0]}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close account menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-3 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                    <div className="border-b border-slate-100 px-3 py-3">
                      <p className="text-xs font-medium text-slate-500">
                        Signed in as
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-slate-900">
                        {user.name}
                      </p>
                    </div>
                    {accountLinks.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-teal-50 hover:text-teal-800"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    ))}
                    <div className="my-2 border-t border-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-xl border border-slate-200 p-2.5 text-slate-700 transition hover:bg-slate-50 md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={linkClass(link.href)}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="my-2 border-t border-slate-100" />

            {user ? (
              <>
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Your account
                </p>
                {accountLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-teal-50 hover:text-teal-800"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-slate-200 px-3 py-3 text-center text-sm font-semibold text-slate-700"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl bg-teal-700 px-3 py-3 text-center text-sm font-bold text-white hover:bg-teal-800"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
