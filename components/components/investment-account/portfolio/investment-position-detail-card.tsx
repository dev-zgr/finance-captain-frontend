"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format, parseISO } from "date-fns"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChartCandlestick,
  Circle,
  Coins,
  HandCoins,
  Hash,
  Percent,
  PiggyBank,
  SearchX,
  ShoppingCart,
  Tag,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  extractInvestmentPositionDetailContent,
  getInvestmentPositionById,
} from "@/lib/investment-account/api"
import type {
  InvestmentApiErrorResponse,
  InvestmentPositionDetailContent,
} from "@/lib/investment-account/types"
import type { RootState } from "@/lib/store"
import { cn } from "@/lib/utils"

type InvestmentPositionDetailCardProps = {
  positionId: string
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function formatCurrency(value: number): string {
  return currencyFormatter.format(Math.abs(Number(value ?? 0)))
}

function formatSignedCurrency(value: number): string {
  const sign = value >= 0 ? "+" : "−"
  return `${sign}${formatCurrency(value)}`
}

function formatSignedPercent(value: number): string {
  const sign = value >= 0 ? "+" : "−"
  return `${sign}${Math.abs(value).toFixed(2)}%`
}

function formatDate(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy · h:mm a")
  } catch {
    return value
  }
}

function getErrorMessage(
  status: number,
  payload?: InvestmentApiErrorResponse
): string {
  if (status === 400) {
    return (
      payload?.fieldErrors?.positionId ??
      payload?.message ??
      "Invalid position ID format."
    )
  }

  if (status === 401) {
    return payload?.message ?? "Your session has expired. Please log in again."
  }

  if (status === 500) {
    return payload?.message ?? "Could not load position details. Please try again."
  }

  return payload?.message ?? "Could not load position details. Please try again."
}

function PositionDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-6 w-24" />
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4 rounded-md border p-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

function getTransactionVisuals(category: string) {
  if (category === "BUY") {
    return {
      itemClass: "border-emerald-500/60 bg-muted/40",
      iconClass: "text-emerald-600 border-emerald-500/40 bg-emerald-500/10",
      amountClass: "text-emerald-600",
      icon: ShoppingCart,
    }
  }

  if (category === "SELL" || category === "DIVIDEND" || category === "REINVEST") {
    return {
      itemClass: "border-rose-500/60 bg-muted/40",
      iconClass: "text-rose-600 border-rose-500/40 bg-rose-500/10",
      amountClass: "text-rose-600",
      icon: HandCoins,
    }
  }

  return {
    itemClass: "border-emerald-500/60 bg-muted/40",
    iconClass: "text-emerald-600 border-emerald-500/40 bg-emerald-500/10",
    amountClass: "text-foreground",
    icon: ShoppingCart,
  }
}

export function InvestmentPositionDetailCard({
  positionId,
}: InvestmentPositionDetailCardProps) {
  const router = useRouter()
  const token = useSelector(
    (state: RootState) => state.auth.content?.token ?? ""
  )
  const abortControllerRef = useRef<AbortController | null>(null)

  const [detail, setDetail] = useState<InvestmentPositionDetailContent | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const fetchPositionDetails = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setErrorMessage(null)
    setNotFound(false)

    try {
      const response = await getInvestmentPositionById(
        token,
        positionId,
        controller.signal
      )

      if (controller.signal.aborted) {
        return
      }

      if (response.status === 200) {
        setSessionExpired(false)
        const payload = extractInvestmentPositionDetailContent(response.data)

        if (!payload?.position) {
          setDetail(null)
          setErrorMessage("Could not load position details. Please try again.")
          return
        }

        setDetail(payload)
        return
      }

      setDetail(null)

      if (response.status === 401) {
        setSessionExpired(true)
      }

      if (response.status === 404) {
        setNotFound(true)
        return
      }

      const body = response.data as InvestmentApiErrorResponse
      setErrorMessage(getErrorMessage(response.status, body))
    } catch {
      if (controller.signal.aborted) {
        return
      }

      setDetail(null)
      setErrorMessage("Could not load position details. Please try again.")
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false)
      }
    }
  }, [positionId, token])

  useEffect(() => {
    void fetchPositionDetails()
  }, [fetchPositionDetails])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const position = detail?.position
  const newestTransactions = useMemo(
    () =>
      [...(detail?.transactions ?? [])].sort(
        (a, b) =>
          new Date(b.transactionDate).getTime() -
          new Date(a.transactionDate).getTime()
      ),
    [detail?.transactions]
  )

  const headerTitle = useMemo(() => {
    if (!position) {
      return `Position #${positionId}`
    }

    return `${position.ticker} · ${position.companyName}`
  }, [position, positionId])

  const isOpen = position?.status === "OPEN"
  const statusColor = isOpen ? "text-emerald-600" : "text-orange-600"

  return (
    <div className="mx-auto max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push("/investment-account/portfolio")}
      >
        <ArrowLeft data-icon="inline-start" />
        Back to Portfolio
      </Button>

      <div className="flex flex-col gap-4">
        {sessionExpired ? (
          <Card role="alert" className="border-destructive/30">
            <CardContent className="flex items-center gap-2 py-3 text-sm text-destructive">
              <AlertCircle />
              Your session has expired. Please log in again.
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>{headerTitle}</CardTitle>
            <CardDescription>Position #{positionId}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <PositionDetailSkeleton />
            ) : notFound ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
                <SearchX className="mx-auto size-10 text-muted-foreground" />
                <p className="text-base font-medium">Position not found</p>
                <p className="text-sm text-muted-foreground">
                  No position with ID {positionId} exists, or it does not belong to your account.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/investment-account/portfolio")}
                >
                  Back to Portfolio
                </Button>
              </div>
            ) : errorMessage ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
                <AlertCircle className="mx-auto size-10 text-destructive" />
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchPositionDetails()}
                >
                  Retry
                </Button>
              </div>
            ) : position ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <p className="text-3xl font-semibold tracking-tight tabular-nums">
                    {formatCurrency(position.marketValue)}
                  </p>
                  <p className={cn("inline-flex items-center gap-2 text-sm font-bold", statusColor)}>
                    {isOpen ? <Circle className="size-2.5 fill-current" /> : null}
                    {position.status}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="size-4" />
                      Ticker
                    </span>
                    <span className="text-sm font-medium">{position.ticker}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Wallet className="size-4" />
                      Quantity
                    </span>
                    <span className="text-sm font-medium tabular-nums">
                      {position.quantity.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShoppingCart className="size-4" />
                      Average Buy Price
                    </span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(position.averageBuyPrice)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <PiggyBank className="size-4" />
                      Total Cost Basis
                    </span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(position.totalCostBasis)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ChartCandlestick className="size-4" />
                      Current Price
                    </span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(position.currentPrice)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="size-4" />
                      Unrealized P/L
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium tabular-nums",
                        position.unrealizedPnl >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      )}
                    >
                      {formatSignedCurrency(position.unrealizedPnl)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Percent className="size-4" />
                      Unrealized P/L %
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium tabular-nums",
                        position.unrealizedPnlPercent >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      )}
                    >
                      {formatSignedPercent(position.unrealizedPnlPercent)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Coins className="size-4" />
                      Realized P/L To Date
                    </span>
                    <span className="text-sm font-medium tabular-nums">
                      {typeof position.realizedPnlToDate === "number"
                        ? formatSignedCurrency(position.realizedPnlToDate)
                        : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="size-4" />
                      Opened At
                    </span>
                    <span className="text-right text-sm font-medium">
                      {formatDate(position.openedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="size-4" />
                      Closed At
                    </span>
                    <span className="text-right text-sm font-medium">
                      {position.closedAt ? formatDate(position.closedAt) : "—"}
                    </span>
                  </div>
                </div>

                {detail?.priceDataPartial ? (
                  <p className="text-sm text-muted-foreground">
                    Some price values may be delayed or unavailable.
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {!loading && !notFound && !errorMessage && position ? (
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                Newest transactions associated with this position.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {newestTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions found for this position.</p>
              ) : (
                <ItemGroup className="gap-2">
                  {newestTransactions.map((transaction) => {
                    const visuals = getTransactionVisuals(
                      transaction.investmentTransactionCategory
                    )
                    const TxIcon = visuals.icon

                    return (
                    <Item
                      key={transaction.id}
                      variant="outline"
                      size="sm"
                      className={cn("rounded-md", visuals.itemClass)}
                    >
                      <ItemMedia
                        variant="icon"
                        className={cn(
                          "rounded-md border p-1.5",
                          visuals.iconClass
                        )}
                      >
                        <TxIcon className="size-4" />
                      </ItemMedia>
                        <ItemContent>
                          <ItemTitle>
                            {transaction.investmentTransactionCategory} ·{" "}
                            {transaction.investmentTransactionType}
                          </ItemTitle>
                          <ItemDescription className="line-clamp-1">
                            {transaction.description?.trim() || "—"}
                          </ItemDescription>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Hash className="size-3" />
                              {transaction.id}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatDate(transaction.transactionDate)}
                            </span>
                            <span>Qty {transaction.quantity.toLocaleString()}</span>
                            <span>@ {formatCurrency(transaction.pricePerShare)}</span>
                            <span>U-P/L {formatSignedCurrency(transaction.unrealizedPnlAtCurrentPrice)}</span>
                          </div>
                        </ItemContent>
                        <div className="ml-auto flex flex-col items-end gap-2">
                          <div
                            className={cn(
                              "text-sm font-semibold tabular-nums",
                              visuals.amountClass
                            )}
                          >
                            {formatCurrency(transaction.amount)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/investment-account/transactions/${transaction.id}`
                              )
                            }
                          >
                            View
                            <ArrowRight data-icon="inline-end" />
                          </Button>
                        </div>
                    </Item>
                    )
                  })}
                </ItemGroup>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
