"use client"

import { useState, useMemo } from "react"
import { ChevronRight, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TransactionTypeBadge } from "@/components/components/checking-account/transaction-type-badge"
import { TransactionCategoryBadge } from "@/components/components/checking-account/transaction-category-badge"
import type { CheckingTransactionListPayload } from "@/lib/co-captain/types"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const getSignedAmount = (amount: number, type: string) => {
  return type === "INCOME" ? amount : -amount
}

const amountColorClass = (transactionType: string) => {
  if (transactionType === "INCOME") return "text-emerald-600 dark:text-emerald-500"
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

const PAGE_SIZE = 10

type SortBy = "date" | "amount" | "transactionId"
type SortDirection = "asc" | "desc"

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
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<SortBy>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const transactions = payload.transactions ?? []
  const totalCount = payload.totalCount ?? 0
  const displayedCount = payload.displayedCount ?? 0
  const appliedFilters = payload.appliedFilters ?? {
    transactionType: null,
    category: null,
    startDate: null,
    endDate: null,
  }

  // Get unique types and categories from the data
  const uniqueTypes = useMemo(() => {
    const types = new Set(transactions.map((t) => t.transactionType))
    return Array.from(types).sort()
  }, [transactions])

  const uniqueCategories = useMemo(() => {
    const categories = new Set(transactions.map((t) => t.category).filter((c): c is string => c !== null && c !== undefined))
    return Array.from(categories).sort()
  }, [transactions])

  // Filter and sort transactions
  const filteredAndSorted = useMemo(() => {
    let filtered = [...transactions]

    if (typeFilter) {
      filtered = filtered.filter((t) => t.transactionType === typeFilter)
    }

    if (categoryFilter) {
      filtered = filtered.filter((t) => t.category === categoryFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: number | string | null = null
      let bVal: number | string | null = null

      switch (sortBy) {
        case "date":
          aVal = new Date(a.transactionDate).getTime()
          bVal = new Date(b.transactionDate).getTime()
          break
        case "amount":
          aVal = a.amount
          bVal = b.amount
          break
        case "transactionId":
          aVal = String(a.id)
          bVal = String(b.id)
          break
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      const anum = typeof aVal === "number" ? aVal : 0
      const bnum = typeof bVal === "number" ? bVal : 0
      return sortDirection === "asc" ? anum - bnum : bnum - anum
    })

    return filtered
  }, [transactions, typeFilter, categoryFilter, sortBy, sortDirection])

  const totalPages = Math.ceil(filteredAndSorted.length / PAGE_SIZE)
  const paginatedTransactions = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredAndSorted.slice(start, start + PAGE_SIZE)
  }, [filteredAndSorted, page])

  const appliedFiltersText = useMemo(
    () => buildAppliedFiltersText(appliedFilters),
    [appliedFilters]
  )

  const transactionPageUrl = useMemo(
    () => buildQueryParams(appliedFilters),
    [appliedFilters]
  )

  const hasMoreResults = totalCount > displayedCount

  // Reset page when filters change
  const handleFilterChange = () => {
    setPage(0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Checking Transactions</DialogTitle>
          {appliedFiltersText && (
            <DialogDescription>{appliedFiltersText}</DialogDescription>
          )}
        </DialogHeader>

        {/* Filters Section */}
        <div className="space-y-3 border-b pb-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={typeFilter ?? "all"} onValueChange={(value) => {
                setTypeFilter(value === "all" ? null : value)
                handleFilterChange()
              }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={categoryFilter ?? "all"} onValueChange={(value) => {
                setCategoryFilter(value === "all" ? null : value)
                handleFilterChange()
              }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Sort By</label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="transactionId">ID</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 px-0"
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                >
                  {sortDirection === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-auto flex-1">
          {paginatedTransactions.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-xs text-muted-foreground">Transaction ID</th>
                  <th className="px-4 py-3 text-left font-medium text-xs text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-xs text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-xs text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-xs text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-xs text-muted-foreground">Description</th>
                  <th className="px-4 py-3 text-center font-medium text-xs text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((transaction, idx) => (
                  <tr key={transaction.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{transaction.id}</td>
                    <td className="px-4 py-3">
                      <TransactionTypeBadge
                        transactionType={transaction.transactionType as "INCOME" | "EXPENSE"}
                        category={transaction.category ?? "OTHER"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {transaction.category ? (
                        <TransactionCategoryBadge category={transaction.category} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className={`px-4 py-3 text-xs font-medium text-right tabular-nums ${amountColorClass(transaction.transactionType)}`}>
                      {formatCurrency(getSignedAmount(transaction.amount, transaction.transactionType))}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-xs">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate">{transaction.description || "—"}</span>
                          </TooltipTrigger>
                          <TooltipContent>{transaction.description}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="size-4" />
                      </Button>
                    </td>
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

        <DialogFooter className="border-t pt-4 space-y-4">
          {hasMoreResults && (
            <div className="text-xs text-muted-foreground">
              Showing {displayedCount} of {totalCount} results available.{" "}
              <a href={transactionPageUrl} className="font-medium text-primary hover:underline">
                View all on full page
              </a>
            </div>
          )}

          <div className="flex items-center justify-between">
            {filteredAndSorted.length > PAGE_SIZE && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setPage((p) => Math.max(0, p - 1))
                      }}
                      className={page === 0 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <PaginationItem key={idx}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setPage(idx)
                        }}
                        isActive={idx === page}
                      >
                        {idx + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }}
                      className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            <Button variant="outline" asChild className="ml-auto">
              <a href={transactionPageUrl}>
                View all transactions
                <ChevronRight className="ml-2 size-4" />
              </a>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
