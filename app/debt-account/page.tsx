"use client"

import { useState } from "react"
import { useSelector } from "react-redux"

import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout"
import { DebtsActionsCard } from "@/components/components/debts-account/debts-actions-card"
import { DebtsAccountSummaryCard } from "@/components/components/debts-account/debts-account-summary-card"
import { GetDebtDialog } from "@/components/components/debts-account/get-debt-dialog"
import { PayDebtDialog } from "@/components/components/debts-account/pay-debt-dialog"
import { DebtsTimeSeriesChart } from "@/components/components/debts-account/debts-time-series-chart"
import { RecentDebtsTransactionsTable } from "@/components/components/debts-account/recent-debts-transactions-table"
import type { RootState } from "@/lib/store"

export default function DebtAccountOverviewPage() {
  const [getDebtDialogOpen, setGetDebtDialogOpen] = useState(false)
  const [payDebtDialogOpen, setPayDebtDialogOpen] = useState(false)
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
          <DebtsTimeSeriesChart token={token} />

          <div className="grid gap-4">
            <DebtsAccountSummaryCard
              token={token}
              refreshKey={summaryRefreshKey}
            />

            <DebtsActionsCard
              onGetDebt={() => setGetDebtDialogOpen(true)}
              onPayDebt={() => setPayDebtDialogOpen(true)}
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

      <PayDebtDialog
        open={payDebtDialogOpen}
        onOpenChange={setPayDebtDialogOpen}
        token={token}
        onSuccess={handleDebtTransactionSuccess}
      />
    </AuthenticatedDashboardLayout>
  )
}
