"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format, parseISO } from "date-fns"
import { AlertCircle, ArrowRight, ExternalLink, Inbox } from "lucide-react"

import { DebtsCategoryBadge } from "@/components/components/debts-account/debts-category-badge"
import { DebtsTransactionTypeBadge } from "@/components/components/debts-account/debts-transaction-type-badge"
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
  extractDebtsTransactionsResponse,
  getDebtsTransactions,
} from "@/lib/debts-account/api"
import type {
  DebtsApiErrorResponse,
  DebtsTransactionRow,
  DebtsTransactionType,
} from "@/lib/debts-account/types"
import { cn } from "@/lib/utils"

type RecentDebtsTransactionsTableProps = {
  token: string
  refreshKey?: number
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function formatTransactionDate(value: string): string {
  try {
    return format(parseISO(value), "MMM dd, yyyy")
  } catch {
    return value
  }
}

function formatSignedAmount(
  amount: number,
  transactionType: DebtsTransactionType
): string {
  const sign = transactionType === "PAYMENT" ? "+" : "−"
  return `${sign}${currencyFormatter.format(Math.abs(amount))}`
}

function getErrorMessage(
  status: number,
  payload?: DebtsApiErrorResponse
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

export function RecentDebtsTransactionsTable({
  token,
  refreshKey,
}: RecentDebtsTransactionsTableProps) {
  const abortControllerRef = useRef<AbortController | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<DebtsTransactionRow[]>([])

  const fetchTransactions = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await getDebtsTransactions(
        token,
        { page: 0, sortBy: "date", sortDirection: "DESC" },
        controller.signal
      )

      if (controller.signal.aborted) {
        return
      }

      if (response.status === 200) {
        const payload = extractDebtsTransactionsResponse(response.data)
        setTransactions(payload?.transactions ?? [])
        return
      }

      if (response.status === 204) {
        setTransactions([])
        return
      }

      const body = response.data as DebtsApiErrorResponse
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
    void fetchTransactions()
  }, [fetchTransactions, refreshKey])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const displayRows = useMemo(() => transactions.slice(0, 10), [transactions])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Liabilities</CardTitle>
            <CardDescription>
              Your 10 most recent debts and payments.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/debt-account/transactions">
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
          <Table className="min-w-[980px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Transaction ID</TableHead>
                <TableHead className="w-[130px]">Type</TableHead>
                <TableHead className="w-[170px]">Category</TableHead>
                <TableHead className="w-[130px]">Date</TableHead>
                <TableHead className="w-[140px] pr-4">Amount</TableHead>
                <TableHead className="w-[260px] pl-4">Description</TableHead>
                <TableHead className="w-[110px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10">
                    <Empty className="border-0 p-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Inbox />
                        </EmptyMedia>
                        <EmptyTitle>No debts transactions found</EmptyTitle>
                        <EmptyDescription>
                          No recent debts activity was returned.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                displayRows.map((transaction) => {
                  const amount = Number(transaction.amount ?? 0)
                  const description = transaction.description?.trim() || "—"

                  return (
                    <TableRow key={transaction.debtsTransactionId}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{transaction.debtsTransactionId}
                      </TableCell>
                      <TableCell>
                        <DebtsTransactionTypeBadge
                          transactionType={transaction.transactionType}
                        />
                      </TableCell>
                      <TableCell>
                        <DebtsCategoryBadge
                          category={transaction.debtCategory}
                          transactionType={transaction.transactionType}
                        />
                      </TableCell>
                      <TableCell>
                        {formatTransactionDate(transaction.date)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "pr-4 font-medium tabular-nums",
                          transaction.transactionType === "PAYMENT"
                            ? "text-emerald-600"
                            : "text-red-600"
                        )}
                      >
                        {formatSignedAmount(
                          amount,
                          transaction.transactionType
                        )}
                      </TableCell>
                      <TableCell className="pl-4">
                        {description === "—" ? (
                          <span className="block max-w-[240px] truncate font-medium text-muted-foreground">
                            —
                          </span>
                        ) : (
                          <Link
                            href={`/debt-account/transactions/${transaction.debtsTransactionId}`}
                            className="block max-w-[240px] truncate font-medium text-primary hover:underline"
                          >
                            {description}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/debt-account/transactions/${transaction.debtsTransactionId}`}
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
