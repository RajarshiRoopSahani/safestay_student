"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BedDouble, Building2, CalendarCheck, Camera, Flag, LayoutDashboard, MessageSquare, Users } from "lucide-react";
import { AdminStats, fetchStats } from "@/services/adminService";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/properties", label: "Properties", icon: BedDouble },
  { href: "/admin/buildings", label: "Buildings", icon: Building2 },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/photos", label: "Photos", icon: Camera },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Refresh the pending counts whenever the admin moves to another screen.
  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => {});
  }, [pathname]);

  const badges: Record<string, number> = {
    "/admin/bookings": stats?.pendingBookings ?? 0,
    "/admin/photos": stats?.pendingPhotos ?? 0,
    "/admin/reviews": stats?.pendingReviews ?? 0,
    "/admin/reports": stats?.openReports ?? 0,
  };

  return (
    <nav aria-label="Admin navigation" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        const count = badges[href] ?? 0;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {count > 0 && (
              <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">{count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
