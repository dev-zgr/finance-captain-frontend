"use client";

import React from "react";

import { Spinner } from "@/components/ui/spinner";

export function LogoutModal({
  open,
  message = "Logging out...",
}: {
  open: boolean;
  message?: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm shadow-lg"
      >
        <Spinner className="size-4" />
        <span>{message}</span>
      </div>
    </div>
  );
}
