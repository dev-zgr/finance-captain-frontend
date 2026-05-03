"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { format, parseISO } from "date-fns"
import { AlertCircle, ArrowRight, ExternalLink, Inbox } from "lucide-react"

import { InvestmentTransactionCategoryBadge } from "@/components/components/investment-account/transactions/investment-transaction-category-badge"
import { InvestmentTransactionTypeBadge } from "@/components/components/investment-account/transactions/investment-transaction-type-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  extractInvestmentTransactionsResponse,
  getInvestmentTransactions,
} from "@/lib/investment-account/api"
import type {
  InvestmentApiErrorResponse,
  InvestmentTransactionCategory,
  InvestmentTransactionRow,
} from "@/lib/investment-account/types"
import type { RootState } from "@/lib/store"
import { cn } from "@/lib/utils"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function formatTransactionDate(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy")
  } catch {
    return value
  }
}

function isPositiveCategory(category: InvestmentTransactionCategory): boolean {
  return category === "DEPOSIT" || category === "SELL"
}

function isGreenAmountCategory(category: InvestmentTransactionCategory): boolean {
  return category === "DEPOSIT" || category === "BUY"
}

function formatSignedAmount(
  amount: number,
  category: InvestmentTransactionCategory
): string {
  const sign = isPositiveCategory(category) ? "+" : "−"
  return `${sign}${currencyFormatter.format(Math.abs(amount))}`
}

function formatPrice(value: number): string {
  return currencyFormatter.format(Math.abs(value))
}

function formatSignedProfitLoss(value: number): string {
  const sign = value >= 0 ? "+" : "−"
  return `${sign}${currencyFormatter.format(Math.abs(value))}`
}

function getErrorMessage(
  status: number,
  payload?: InvestmentApiErrorResponse
): string {
  if (status === 400) {
    return payload?.message ?? "Invalid request parameters."
  }

  if (status === 401) {
    return payload?.message ?? "Your session has expired. Please log in again."
  }

  if (status === 500) {
    return (
      payload?.message ??
      "An unexpected error occurred while retrieving transactions."
    )
  }

  return payload?.message ?? "Could not load recent transactions."
}

export function RecentInvestmentTransactionsCard() {
  const token = useSelector((state: RootState) => state.auth.content?.token ?? "")
  const abortControllerRef = useRef<AbortController | null>(null)

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<InvestmentTransactionRow[]>([])

  const fetchTransactions = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await getInvestmentTransactions(
        token,
        { page: 0, sortBy: "date", sortDirection: "DESC" },
        controller.signal
      )

      if (controller.signal.aborted) {
        return
      }

      if (response.status === 200) {
        const payload = extractInvestmentTransactionsResponse(response.data)
        setTransactions(payload?.items ?? [])
        return
      }

      if (response.status === 204) {
        setTransactions([])
        return
      }

      const body = response.data as InvestmentApiErrorResponse
      setTransactions([])
      setErrorMessage(getErrorMessage(response.status, body))
    } catch {
      if (controller.signal.aborted) {
        return
      }

      setTransactions([])
      setErrorMessage(
        "An unexpected error occurred while retrieving transactions."
      )
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false)
      }
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setTransactions([])
      return
    }

    void fetchTransactions()
  }, [fetchTransactions, token])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const displayRows = useMemo(() => transactions.slice(0, 10), [transactions])

  return (
    <Card className="col-span-12">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your 10 most recent investment activities.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/investment-account/transactions">
              Get more details
              <ExternalLink data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="max-w-full overflow-x-auto">
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center">
            <Spinner className="size-5" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading recent transactions...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <AlertCircle className="text-destructive" />
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={fetchTransactions}>
              Retry
            </Button>
          </div>
        ) : (
          <Table className="min-w-[1500px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px]">Tx ID</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[140px]">Category</TableHead>
                <TableHead className="w-[130px]">Date</TableHead>
                <TableHead className="w-[140px] pr-4">Amount</TableHead>
                <TableHead className="w-[90px]">Symbol</TableHead>
                <TableHead className="w-[100px]">Quantity</TableHead>
                <TableHead className="w-[140px]">Price / Share</TableHead>
                <TableHead className="w-[140px]">Realized P/L</TableHead>
                <TableHead className="w-[240px] pl-2">Description</TableHead>
                <TableHead className="w-[95px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-10">
                    <Empty className="border-0 p-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Inbox />
                        </EmptyMedia>
                        <EmptyTitle>No investment transactions found</EmptyTitle>
                        <EmptyDescription>
                          No recent investment activity was returned.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                displayRows.map((transaction) => {
                  const amount = Number(transaction.amount ?? 0)
                  const description = transaction.description?.trim() || "—"
                  const isAmountGreen = isGreenAmountCategory(
                    transaction.investmentTransactionCategory
                  )
                  const quantity =
                    typeof transaction.quantity === "number"
                      ? transaction.quantity.toLocaleString()
                      : "—"
                  const pricePerShare =
                    typeof transaction.pricePerShare === "number"
                      ? formatPrice(transaction.pricePerShare)
                      : "—"
                  const realizedProfitLoss =
                    typeof transaction.realizedProfitLoss === "number"
                      ? formatSignedProfitLoss(transaction.realizedProfitLoss)
                      : "—"

                  return (
                    <TableRow key={transaction.transactionId}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{transaction.transactionId}
                      </TableCell>
                      <TableCell>
                        <InvestmentTransactionTypeBadge
                          type={transaction.investmentTransactionType}
                        />
                      </TableCell>
                      <TableCell>
                        <InvestmentTransactionCategoryBadge
                          category={transaction.investmentTransactionCategory}
                        />
                      </TableCell>
                      <TableCell>
                        {formatTransactionDate(transaction.transactionDate)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "pr-4 font-medium tabular-nums",
                          isAmountGreen ? "text-emerald-600" : "text-rose-600"
                        )}
                      >
                        {formatSignedAmount(
                          amount,
                          transaction.investmentTransactionCategory
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.ticker ? (
                          <div className="flex items-center gap-2">
                            <Avatar size="sm">
                              <AvatarImage
                                src={
                                  transaction.companyLogoUrl ??
                                  transaction.symbolUrl ??
                                  undefined
                                }
                                alt={`${transaction.ticker} logo`}
                              />
                              <AvatarFallback>
                                {transaction.ticker.slice(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{transaction.ticker}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">{quantity}</TableCell>
                      <TableCell className="tabular-nums">
                        {pricePerShare}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "tabular-nums",
                          typeof transaction.realizedProfitLoss === "number"
                            ? transaction.realizedProfitLoss >= 0
                              ? "text-emerald-600"
                              : "text-rose-600"
                            : "text-muted-foreground"
                        )}
                      >
                        {realizedProfitLoss}
                      </TableCell>
                      <TableCell className="pl-2">
                        {description === "—" ? (
                          <span className="block max-w-[240px] truncate font-medium text-muted-foreground">
                            —
                          </span>
                        ) : (
                          <Link
                            href={`/investment-account/transactions/${transaction.transactionId}`}
                            className="block max-w-[240px] truncate font-medium text-primary hover:underline"
                          >
                            {description}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/investment-account/transactions/${transaction.transactionId}`}
                          >
                            Details
                            <ArrowRight data-icon="inline-end" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
