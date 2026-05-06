"use client"

import { useMemo, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CheckingTransactionListPayload } from "@/lib/co-captain/types"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const amountColorClass = (type: string) => {
  if (type.toLowerCase() === "income") return "text-green-600 dark:text-green-500"
  return "text-red-600 dark:text-red-500"
}

interface FilterState {
  type: string | null
  categories: string[]
  sortBy: "date" | "amount" | "transactionId"
  sortOrder: "asc" | "desc"
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
  const [filters, setFilters] = useState<FilterState>({
    type: null,
    categories: [],
    sortBy: "date",
    sortOrder: "desc",
  })

  const uniqueTypes = useMemo(() => {
    const types = new Set(payload.transactions?.map((t) => t.type) ?? [])
    return Array.from(types).sort()
  }, [payload.transactions])

  const uniqueCategories = useMemo(() => {
    const categories = new Set(payload.transactions?.map((t) => t.category) ?? [])
    return Array.from(categories).sort()
  }, [payload.transactions])

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = payload.transactions ?? []

    if (filters.type) {
      filtered = filtered.filter((t) => t.type === filters.type)
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter((t) => filters.categories.includes(t.category))
    }

    const sorted = [...filtered].sort((a, b) => {
      let aVal: number | string = ""
      let bVal: number | string = ""

      switch (filters.sortBy) {
        case "date":
          aVal = new Date(a.date).getTime()
          bVal = new Date(b.date).getTime()
          break
        case "amount":
          aVal = a.amount
          bVal = b.amount
          break
        case "transactionId":
          aVal = a.transactionId
          bVal = b.transactionId
          break
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return filters.sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      const anum = typeof aVal === "number" ? aVal : 0
      const bnum = typeof bVal === "number" ? bVal : 0

      return filters.sortOrder === "asc" ? anum - bnum : bnum - anum
    })

    return sorted
  }, [payload.transactions, filters])

  const dateRangeText = useMemo(() => {
    const { startDate, endDate } = payload.dateRange ?? {}
    if (!startDate && !endDate) return ""
    if (startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      const end = new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      return `${start} - ${end}`
    }
    if (startDate) {
      return `From ${new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    }
    return `Until ${new Date(endDate!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
  }, [payload.dateRange])

  const toggleCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Checking Transactions</DialogTitle>
          {dateRangeText && (
            <DialogDescription>{dateRangeText}</DialogDescription>
          )}
        </DialogHeader>

        {/* Filters Section */}
        <div className="space-y-3 border-b pb-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {/* Type Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={filters.type ?? ""} onValueChange={(value) => {
                setFilters((prev) => ({
                  ...prev,
                  type: value || null,
                }))
              }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Categories</label>
              <Select>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={
                    filters.categories.length > 0
                      ? `${filters.categories.length} selected`
                      : "All categories"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 space-y-2">
                    {uniqueCategories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`cat-${category}`}
                          checked={filters.categories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`cat-${category}`} className="text-xs cursor-pointer">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Sort By</label>
              <Select value={filters.sortBy} onValueChange={(value) => {
                setFilters((prev) => ({
                  ...prev,
                  sortBy: value as "date" | "amount" | "transactionId",
                }))
              }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="transactionId">ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr className="border-b">
                <th className="px-4 py-2 text-left font-medium text-xs text-muted-foreground">Transaction ID</th>
                <th className="px-4 py-2 text-left font-medium text-xs text-muted-foreground">Type</th>
                <th className="px-4 py-2 text-left font-medium text-xs text-muted-foreground">Category</th>
                <th className="px-4 py-2 text-left font-medium text-xs text-muted-foreground">Date</th>
                <th className="px-4 py-2 text-right font-medium text-xs text-muted-foreground">Amount</th>
                <th className="px-4 py-2 text-left font-medium text-xs text-muted-foreground">Description</th>
                <th className="px-4 py-2 text-center font-medium text-xs text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTransactions.length > 0 ? (
                filteredAndSortedTransactions.map((transaction, idx) => (
                  <tr
                    key={transaction.id}
                    className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}
                  >
                    <td className="px-4 py-2 text-xs text-muted-foreground">{transaction.transactionId}</td>
                    <td className="px-4 py-2 text-xs">{transaction.type}</td>
                    <td className="px-4 py-2 text-xs">{transaction.category}</td>
                    <td className="px-4 py-2 text-xs">{formatDate(transaction.date)}</td>
                    <td className={`px-4 py-2 text-xs font-medium text-right ${amountColorClass(transaction.type)}`}>
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-4 py-2 text-xs truncate max-w-xs">{transaction.description}</td>
                    <td className="px-4 py-2 text-center">
                      <button className="text-muted-foreground hover:text-foreground transition">
                        <ChevronRight className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-xs text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" asChild>
            <a href="/checking-account/transactions">
              Go to Checking Account
              <ChevronRight className="ml-2 size-4" />
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
