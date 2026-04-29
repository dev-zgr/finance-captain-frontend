"use client";

import { useState } from "react";
import { useSelector } from "react-redux";

import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout";
import { DebtsAccountSummaryCard } from "@/components/components/debts-account/debts-account-summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RootState } from "@/lib/store";

export default function DebtAccountOverviewPage() {
  const [summaryRefreshKey] = useState(0);
  const token = useSelector((state: RootState) => state.auth.content?.token ?? "");

  return (
    <AuthenticatedDashboardLayout>
      <section className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Debts Account</h1>

        <div className="grid gap-4 lg:grid-cols-[13fr_7fr]">
          <Card className="h-full min-h-[260px]">
            <CardHeader>
              <CardTitle>Debts Activity</CardTitle>
              <CardDescription>Debt trend chart will be added in a follow-up issue.</CardDescription>
            </CardHeader>
            <CardContent>Chart</CardContent>
          </Card>

          <div className="grid gap-4">
            <DebtsAccountSummaryCard token={token} refreshKey={summaryRefreshKey} />

            <Card>
              <CardHeader>
                <CardTitle>Debts Actions</CardTitle>
                <CardDescription>Debt actions will be added in a follow-up issue.</CardDescription>
              </CardHeader>
              <CardContent>Actions</CardContent>
            </Card>
          </div>
        </div>

        <Card className="min-h-[180px]">
          <CardHeader>
            <CardTitle>Recent Debts Transactions</CardTitle>
            <CardDescription>Recent debts transactions will be added in a follow-up issue.</CardDescription>
          </CardHeader>
          <CardContent>Transactions</CardContent>
        </Card>
      </section>
    </AuthenticatedDashboardLayout>
  );
}
