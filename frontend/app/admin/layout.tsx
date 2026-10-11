"use client";

import AdminSidebar from "@/components/AdminSidebar";
import EmptyState from "@/components/EmptyState";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";

function AdminShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user?.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Admins only"
          description="You do not have permission to view this area."
          actionLabel="Go to home"
          actionHref="/"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AdminSidebar />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}
