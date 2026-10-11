"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <LoadingSpinner />
      </div>
    );
  }
  return <>{children}</>;
}
