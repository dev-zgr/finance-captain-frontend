"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

import type { RootState } from "@/lib/store";
import { assertAuthenticated, UnauthorizedError } from "@/lib/auth/errors";

export function useRequireAuth() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      assertAuthenticated(isAuthenticated);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        router.replace("/login");
      } else {
        throw error;
      }
    }
  }, [isAuthenticated, isHydrated, router]);

  return {
    isHydrated,
    isAuthorized: isHydrated && isAuthenticated,
  };
}
