"use client"

import { useCallback, useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import {
  AlertCircle,
  BarChart3,
  Calendar,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { useDispatch } from "react-redux"

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
import { getInvestmentSummary } from "@/lib/investment-account/api"
import type {
  InvestmentApiSuccessResponse,
  InvestmentSummary,
} from "@/lib/investment-account/types"
import {
  setInvestmentError,
  setInvestmentStatus,
  setInvestmentSummary,
} from "@/lib/slices/investmentAccountSlice"
import type { AppDispatch } from "@/lib/store"

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

const ERROR_MESSAGE = "Could not load account balances. Please try again."

type Props = {
  token: string
  refreshKey?: number
}

export function InvestmentSummaryCard({ token, refreshKey }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const [summary, setSummary] = useState<InvestmentSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      dispatch(setInvestmentStatus({ key: "summary", status: "loading" }))

      try {
        const response = await getInvestmentSummary(token, signal)
        if (signal?.aborted) return

        if (response.status === 200) {
          const content = getWrappedContent<InvestmentSummary>(response.data)
          setSummary(content)
          dispatch(setInvestmentSummary(content))
        } else {
          setError(ERROR_MESSAGE)
          dispatch(setInvestmentError({ key: "summary", error: ERROR_MESSAGE }))
        }
      } catch {
        if (signal?.aborted) return
        setError(ERROR_MESSAGE)
        dispatch(setInvestmentError({ key: "summary", error: ERROR_MESSAGE }))
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [dispatch, token]
  )

  useEffect(() => {
    const controller = new AbortController()
    void fetchSummary(controller.signal)
    return () => controller.abort()
  }, [fetchSummary, refreshKey])

  const getPLColor = (value: number) => {
    if (value > 0) return "text-emerald-600 dark:text-emerald-500"
    if (value < 0) return "text-rose-600 dark:text-rose-500"
    return "text-muted-foreground"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Summary</CardTitle>
        <CardDescription>Your investment account at a glance.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => fetchSummary()}
            >
              Retry
            </Button>
          </div>
        ) : !summary?.hasAccount ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">
              You have not started investing yet. Deposit funds to begin.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Account Value</p>
              <p className="text-2xl font-semibold tracking-tight">
                {formatCurrency(summary.accountValue ?? 0)}
              </p>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="size-4 text-muted-foreground" />
                  Cash Available to Trade
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(summary.cashBalance ?? 0)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="size-4 text-muted-foreground" />
                  Market Value
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(summary.marketValue ?? 0)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp
                    className={`size-4 ${
                      (summary.unrealizedPnl ?? 0) >= 0
                        ? "text-emerald-600 dark:text-emerald-500"
                        : "text-rose-600 dark:text-rose-500"
                    }`}
                  />
                  Unrealized P/L
                </span>
                <span
                  className={`text-sm font-medium tabular-nums ${getPLColor(summary.unrealizedPnl ?? 0)}`}
                >
                  {formatCurrency(summary.unrealizedPnl ?? 0)} (
                  {(summary.unrealizedPnlPercent ?? 0).toFixed(2)}%)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingDown className="size-4 text-muted-foreground" />
                  This Month Net P/L
                </span>
                <span
                  className={`text-sm font-medium tabular-nums ${getPLColor(summary.thisMonthNetPnl ?? 0)}`}
                >
                  {formatCurrency(summary.thisMonthNetPnl ?? 0)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  Month-over-Month Growth
                </span>
                <span
                  className={`text-sm font-medium tabular-nums ${getPLColor(summary.portfolioGrowthRatePercent ?? 0)}`}
                >
                  {(summary.portfolioGrowthRatePercent ?? 0).toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4 text-muted-foreground" />
                  Account opened
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {summary.openingDate
                    ? format(parseISO(summary.openingDate), "MMM d, yyyy")
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
