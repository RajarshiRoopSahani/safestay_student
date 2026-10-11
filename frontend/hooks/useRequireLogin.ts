"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function useRequireLogin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  return useCallback((): boolean => {
    if (loading) return false;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return false;
    }
    return true;
  }, [user, loading, router, pathname]);
}
