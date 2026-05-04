"use client"

import { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import { ActionsCard } from "@/components/components/investment-account/overview/ActionsCard"
import { InvestmentChartsCard } from "@/components/components/investment-account/overview/investment-charts-card"
import { InvestmentPositionsPreviewCard } from "@/components/components/investment-account/overview/investment-positions-preview-card"
import { InvestmentSummaryCard } from "@/components/components/investment-account/overview/investment-summary-card"
import { OverviewAiNewsCard } from "@/components/components/investment-account/overview/overview-ai-news-card"
import { RecentInvestmentTransactionsCard } from "@/components/components/investment-account/overview/recent-investment-transactions-card"
import { DepositFundsDialog } from "@/components/components/investment-account/transactions/DepositFundsDialog"
import { WithdrawFundsDialog } from "@/components/components/investment-account/transactions/WithdrawFundsDialog"
import { getAccountSummary } from "@/lib/checking-account/api"
import type {
  AccountSummary,
  ApiSuccessResponse,
} from "@/lib/checking-account/types"
import { setCheckingSummary } from "@/lib/slices/checkingAccountSlice"
import type { AppDispatch, RootState } from "@/lib/store"

function getCheckingContent(data: unknown): AccountSummary | null {
  if (!data || typeof data !== "object") {
    return null
  }
  const wrapped = data as ApiSuccessResponse<AccountSummary> & {
    data?: AccountSummary
  }
  return wrapped.content ?? wrapped.data ?? null
}

export function InvestmentOverviewClient() {
  const dispatch = useDispatch<AppDispatch>()
  const token = useSelector((state: RootState) => state.auth.content?.token ?? "")
  const [depositDialogOpen, setDepositDialogOpen] = useState(false)
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0)

  const fetchCheckingSummary = useCallback(async () => {
    if (!token) return
    try {
      const response = await getAccountSummary(token)
      const checkingSummary =
        response.status === 200 ? getCheckingContent(response.data) : null
      dispatch(setCheckingSummary(checkingSummary))
    } catch {
      dispatch(setCheckingSummary(null))
    }
  }, [dispatch, token])

  useEffect(() => {
    void fetchCheckingSummary()
  }, [fetchCheckingSummary, summaryRefreshKey])

  const handleTransferSuccess = useCallback(() => {
    setSummaryRefreshKey((currentKey) => currentKey + 1)
  }, [])

  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        <InvestmentChartsCard token={token} />

        <div className="col-span-4 flex flex-col gap-6 max-lg:col-span-12">
          <InvestmentSummaryCard token={token} refreshKey={summaryRefreshKey} />
          <ActionsCard
            onDepositFunds={() => setDepositDialogOpen(true)}
            onWithdrawFunds={() => setWithdrawDialogOpen(true)}
          />
        </div>

        <InvestmentPositionsPreviewCard />
        <OverviewAiNewsCard />

        <RecentInvestmentTransactionsCard />
      </div>

      <DepositFundsDialog
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        token={token}
        onSuccess={handleTransferSuccess}
      />
      <WithdrawFundsDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
        token={token}
        onSuccess={handleTransferSuccess}
      />
    </>
  )
}
