"use client"

import { AlertCircle } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import { ActionsCard } from "@/components/components/investment-account/overview/ActionsCard"
import { DepositFundsDialog } from "@/components/components/investment-account/transactions/DepositFundsDialog"
import { WithdrawFundsDialog } from "@/components/components/investment-account/transactions/WithdrawFundsDialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { getAccountSummary } from "@/lib/checking-account/api"
import type { AccountSummary } from "@/lib/checking-account/types"
import {
  getInvestmentSummary,
  getInvestmentTransactions,
} from "@/lib/investment-account/api"
import type {
  InvestmentApiSuccessResponse,
  InvestmentPagedResponse,
  InvestmentSummary,
  InvestmentTransactionDTO,
} from "@/lib/investment-account/types"
import { setCheckingSummary } from "@/lib/slices/checkingAccountSlice"
import {
  setInvestmentError,
  setInvestmentStatus,
  setInvestmentSummary,
  setInvestmentTransactions,
} from "@/lib/slices/investmentAccountSlice"
import type { AppDispatch, RootState } from "@/lib/store"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)

function getWrappedContent<T>(data: unknown): T | null {
  if (!data || typeof data !== "object") {
    return null
  }

  const wrapped = data as InvestmentApiSuccessResponse<T>
  return wrapped.content ?? wrapped.data ?? null
}

function getInvestmentTransactionsContent(data: unknown) {
  const direct = data as InvestmentPagedResponse<InvestmentTransactionDTO>
  if (Array.isArray(direct?.items)) {
    return direct
  }

  return getWrappedContent<InvestmentPagedResponse<InvestmentTransactionDTO>>(
    data
  )
}

function SummaryMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}

function InvestmentSummaryCard({
  loading,
  error,
  onRetry,
}: {
  loading: boolean
  error: string | null
  onRetry: () => void
}) {
  const investmentSummary = useSelector(
    (state: RootState) => state.investmentAccount.summary
  )
  const checkingSummary = useSelector(
    (state: RootState) => state.checkingAccount.summary
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
        <CardDescription>Balances across linked accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-3">
            <AlertCircle className="text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" type="button" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <SummaryMetric
              label="Investment Cash"
              // TODO: Replace this fallback once the Investment Account Summary
              // endpoint is available; until then the balance can display as $0.00.
              value={formatCurrency(investmentSummary?.accountBalance ?? 0)}
            />
            <SummaryMetric
              label="Portfolio Value"
              value={formatCurrency(investmentSummary?.totalPortfolioValue ?? 0)}
            />
            <SummaryMetric
              label="Checking Balance"
              value={formatCurrency(checkingSummary?.accountBalance ?? 0)}
            />
            <Separator />
            <SummaryMetric
              label="Total Gain/Loss"
              value={formatCurrency(investmentSummary?.totalGainLoss ?? 0)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RecentInvestmentTransactionsCard() {
  const transactions = useSelector(
    (state: RootState) => state.investmentAccount.transactions?.items ?? []
  )
  const displayTransactions = useMemo(
    () => transactions.slice(0, 5),
    [transactions]
  )

  return (
    <Card className="col-span-12">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Latest investment account activity.</CardDescription>
      </CardHeader>
      <CardContent>
        {displayTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No recent investment transactions found.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {displayTransactions.map((transaction) => (
              <div
                key={transaction.transactionId}
                className="flex items-center justify-between gap-4 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">{transaction.transactionType}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {transaction.description || "No description"}
                  </p>
                </div>
                <span className="font-medium tabular-nums">
                  {formatCurrency(Number(transaction.amount ?? 0))}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function InvestmentOverviewClient() {
  const dispatch = useDispatch<AppDispatch>()
  const token = useSelector((state: RootState) => state.auth.content?.token ?? "")
  const [depositDialogOpen, setDepositDialogOpen] = useState(false)
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverviewData = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    dispatch(setInvestmentStatus({ key: "summary", status: "loading" }))
    dispatch(setInvestmentStatus({ key: "transactions", status: "loading" }))

    try {
      const [investmentSummaryResponse, checkingSummaryResponse, transactionsResponse] =
        await Promise.all([
          getInvestmentSummary(token),
          getAccountSummary(token),
          getInvestmentTransactions(token, { page: 0, size: 10 }),
        ])

      const investmentSummary =
        investmentSummaryResponse.status === 200
          ? getWrappedContent<InvestmentSummary>(investmentSummaryResponse.data)
          : null
      const checkingSummary =
        checkingSummaryResponse.status === 200
          ? getWrappedContent<AccountSummary>(checkingSummaryResponse.data)
          : null
      const transactions =
        transactionsResponse.status === 200
          ? getInvestmentTransactionsContent(transactionsResponse.data)
          : null

      dispatch(setInvestmentSummary(investmentSummary))
      dispatch(setCheckingSummary(checkingSummary))
      dispatch(setInvestmentTransactions(transactions))

      if (!investmentSummary || !checkingSummary) {
        setError("Could not load account balances. Please try again.")
        dispatch(
          setInvestmentError({
            key: "summary",
            error: "Could not load account balances. Please try again.",
          })
        )
      }
    } catch {
      setError("Could not load account balances. Please try again.")
      dispatch(
        setInvestmentError({
          key: "summary",
          error: "Could not load account balances. Please try again.",
        })
      )
    } finally {
      setLoading(false)
    }
  }, [dispatch, token])

  useEffect(() => {
    void fetchOverviewData()
  }, [fetchOverviewData, summaryRefreshKey])

  const handleTransferSuccess = useCallback(() => {
    setSummaryRefreshKey((currentKey) => currentKey + 1)
  }, [])

  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-8 max-lg:col-span-12">
          <CardHeader>
            <CardTitle>Charts</CardTitle>
            <CardDescription>
              Investment performance charts will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[240px] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
              Performance chart data will appear here.
            </div>
          </CardContent>
        </Card>

        <div className="col-span-4 flex flex-col gap-6 max-lg:col-span-12">
          <InvestmentSummaryCard
            loading={loading}
            error={error}
            onRetry={fetchOverviewData}
          />
          <ActionsCard
            onDepositFunds={() => setDepositDialogOpen(true)}
            onWithdrawFunds={() => setWithdrawDialogOpen(true)}
          />
        </div>

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
