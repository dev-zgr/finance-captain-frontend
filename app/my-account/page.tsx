"use client";

import React from "react";
import { useSelector } from "react-redux";

import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout";
import type { RootState } from "@/lib/store";

export default function MyAccountPage() {
  const { content } = useSelector((state: RootState) => state.auth);

  const firstName = content?.user?.firstName ?? "Guest";
  const lastName = content?.user?.lastName ?? "User";
  const email = content?.user?.email ?? "unknown@example.com";

  return (
    <AuthenticatedDashboardLayout>
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">My Account</h1>
        <p className="text-sm text-muted-foreground">
          {firstName} {lastName}
        </p>
        <p className="text-sm text-muted-foreground">{email}</p>
      </section>
    </AuthenticatedDashboardLayout>
  );
}
