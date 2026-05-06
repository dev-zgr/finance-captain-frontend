"use client"

import { useMemo } from "react"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { CheckingTransactionListPayload } from "@/lib/co-captain/types"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const amountColorClass = (transactionType: string) => {
  if (transactionType === "INCOME") return "text-green-600 dark:text-green-500"
  return "text-red-600 dark:text-red-500"
}

const buildAppliedFiltersText = (filters: {
  transactionType: string | null
  category: string | null
  startDate: string | null
  endDate: string | null
}) => {
  const parts: string[] = []

  if (filters.transactionType) {
    parts.push(`Type: ${filters.transactionType}`)
  }

  if (filters.category) {
    parts.push(`Category: ${filters.category}`)
  }

  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const end = new Date(filters.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    parts.push(`${start} – ${end}`)
  } else if (filters.startDate) {
    const start = new Date(filters.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    parts.push(`from ${start}`)
  } else if (filters.endDate) {
    const end = new Date(filters.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    parts.push(`until ${end}`)
  }

  return parts.length > 0 ? parts.join(" • ") : undefined
}

const buildQueryParams = (filters: {
  transactionType: string | null
  category: string | null
  startDate: string | null
  endDate: string | null
}) => {
  const params = new URLSearchParams()

  if (filters.transactionType) params.set("type", filters.transactionType)
  if (filters.category) params.set("category", filters.category)
  if (filters.startDate) params.set("startDate", filters.startDate)
  if (filters.endDate) params.set("endDate", filters.endDate)

  const query = params.toString()
  return query ? `/checking-account/transactions?${query}` : "/checking-account/transactions"
}

export interface CheckingTransactionListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payload: Partial<CheckingTransactionListPayload>
}

export function CheckingTransactionListModal({
  open,
  onOpenChange,
  payload,
}: CheckingTransactionListModalProps) {
  const transactions = payload.transactions ?? []
  const totalCount = payload.totalCount ?? 0
  const displayedCount = payload.displayedCount ?? 0
  const appliedFilters = payload.appliedFilters ?? {
    transactionType: null,
    category: null,
    startDate: null,
    endDate: null,
  }

  const appliedFiltersText = useMemo(
    () => buildAppliedFiltersText(appliedFilters),
    [appliedFilters]
  )

  const transactionPageUrl = useMemo(
    () => buildQueryParams(appliedFilters),
    [appliedFilters]
  )

  const hasMoreResults = totalCount > displayedCount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Checking Transactions</DialogTitle>
          {appliedFiltersText && (
            <DialogDescription>{appliedFiltersText}</DialogDescription>
          )}
        </DialogHeader>

        {/* Table Section */}
        <div className="overflow-auto flex-1">
          {transactions.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-medium text-xs text-muted-foreground">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-xs text-muted-foreground">Type</th>
                  <th className="px-4 py-2 text-left font-medium text-xs text-muted-foreground">Category</th>
                  <th className="px-4 py-2 text-right font-medium text-xs text-muted-foreground">Amount</th>
                  <th className="px-4 py-2 text-left font-medium text-xs text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, idx) => (
                  <tr
                    key={transaction.id}
                    className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}
                  >
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className="px-4 py-2 text-xs font-medium">{transaction.transactionType}</td>
                    <td className="px-4 py-2 text-xs">{transaction.category || "—"}</td>
                    <td className={`px-4 py-2 text-xs font-medium text-right ${amountColorClass(transaction.transactionType)}`}>
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-4 py-2 text-xs truncate max-w-sm">{transaction.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No transactions found
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 flex items-center justify-between">
          {hasMoreResults && (
            <p className="text-xs text-muted-foreground">
              Showing {displayedCount} of {totalCount} results
            </p>
          )}
          <Button variant="outline" asChild>
            <a href={transactionPageUrl}>
              View all transactions
              <ChevronRight className="ml-2 size-4" />
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
