"use client"

import { useState } from "react"
import { useSelector } from "react-redux"

import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout"
import { DebtsActionsCard } from "@/components/components/debts-account/debts-actions-card"
import { DebtsAccountSummaryCard } from "@/components/components/debts-account/debts-account-summary-card"
import { GetDebtDialog } from "@/components/components/debts-account/get-debt-dialog"
import { RecentDebtsTransactionsTable } from "@/components/components/debts-account/recent-debts-transactions-table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { RootState } from "@/lib/store"

export default function DebtAccountOverviewPage() {
  const [getDebtDialogOpen, setGetDebtDialogOpen] = useState(false)
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0)
  const token = useSelector(
    (state: RootState) => state.auth.content?.token ?? ""
  )

  const handleDebtTransactionSuccess = () =>
    setSummaryRefreshKey((key) => key + 1)

  return (
    <AuthenticatedDashboardLayout>
      <section className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Debts Account</h1>

        <div className="grid gap-4 lg:grid-cols-[13fr_7fr]">
          <Card className="h-full min-h-[260px]">
            <CardHeader>
              <CardTitle>Debts Activity</CardTitle>
              <CardDescription>
                Debt trend chart will be added in a follow-up issue.
              </CardDescription>
            </CardHeader>
            <CardContent>Chart</CardContent>
          </Card>

          <div className="grid gap-4">
            <DebtsAccountSummaryCard
              token={token}
              refreshKey={summaryRefreshKey}
            />

            <DebtsActionsCard
              onGetDebt={() => setGetDebtDialogOpen(true)}
              onPayDebt={() => undefined}
            />
          </div>
        </div>

        <RecentDebtsTransactionsTable
          token={token}
          refreshKey={summaryRefreshKey}
        />
      </section>

      <GetDebtDialog
        open={getDebtDialogOpen}
        onOpenChange={setGetDebtDialogOpen}
        token={token}
        onSuccess={handleDebtTransactionSuccess}
      />
    </AuthenticatedDashboardLayout>
  )
}
