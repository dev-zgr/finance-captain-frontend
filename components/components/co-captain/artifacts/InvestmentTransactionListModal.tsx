"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, ChevronDown, InboxIcon, ListFilter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InvestmentTransactionTypeBadge } from "@/components/components/investment-account/transactions/investment-transaction-type-badge"
import { InvestmentTransactionCategoryBadge } from "@/components/components/investment-account/transactions/investment-transaction-category-badge"
import { cn } from "@/lib/utils"
import type { InvestmentTransactionListPayload } from "@/lib/co-captain/types"
import type { InvestmentTransactionCategory, InvestmentTransactionType } from "@/lib/investment-account/types"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return dateString
  }
}

const isInflow = (category: string) => category === "DEPOSIT" || category === "BUY"

const getSignedAmount = (amount: number, category: string) =>
  isInflow(category) ? amount : -amount

function buildPaginationItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const current = currentPage + 1
  const pages = new Set<number>([1, totalPages, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const result: Array<number | "ellipsis"> = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("ellipsis")
    result.push(p)
  })
  return result
}

const ALL_CATEGORIES: { value: InvestmentTransactionCategory; label: string }[] = [
  { value: "DEPOSIT", label: "Deposit" },
  { value: "WITHDRAW", label: "Withdraw" },
  { value: "BUY", label: "Buy" },
  { value: "SELL", label: "Sell" },
]

const TRANSFER_CATEGORIES: { value: InvestmentTransactionCategory; label: string }[] = [
  { value: "DEPOSIT", label: "Deposit" },
  { value: "WITHDRAW", label: "Withdraw" },
]

const TRADE_CATEGORIES: { value: InvestmentTransactionCategory; label: string }[] = [
  { value: "BUY", label: "Buy" },
  { value: "SELL", label: "Sell" },
]

const PAGE_SIZE = 10
type SortBy = "date" | "amount"
type SortDirection = "ASC" | "DESC"
type TypeFilter = "" | "TRANSFER" | "TRADE"

const DEFAULT_SORT_BY: SortBy = "date"
const DEFAULT_SORT_DIRECTION: SortDirection = "DESC"

export interface InvestmentTransactionListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payload: Partial<InvestmentTransactionListPayload>
}

export function InvestmentTransactionListModal({
  open,
  onOpenChange,
  payload,
}: InvestmentTransactionListModalProps) {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<SortBy>(DEFAULT_SORT_BY)
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_SORT_DIRECTION)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("")
  const [selectedCategories, setSelectedCategories] = useState<InvestmentTransactionCategory[]>([])

  const totalCount = payload.totalCount ?? 0
  const displayedCount = payload.displayedCount ?? 0
  const hasMoreResults = totalCount > displayedCount

  const transactions = useMemo(() => payload.transactions ?? [], [payload.transactions])
  const appliedFilters = useMemo(() => payload.appliedFilters ?? {
    transactionTypes: null,
    categories: null,
    startDate: null,
    endDate: null,
    tickers: null,
    q: null,
  }, [payload.appliedFilters])

  const availableCategories = useMemo(() => {
    if (typeFilter === "TRANSFER") return TRANSFER_CATEGORIES
    if (typeFilter === "TRADE") return TRADE_CATEGORIES
    return ALL_CATEGORIES
  }, [typeFilter])

  const showTradeColumns = useMemo(() => {
    if (typeFilter === "TRADE") return true
    if (selectedCategories.includes("BUY") || selectedCategories.includes("SELL")) return true
    return false
  }, [typeFilter, selectedCategories])

  const filteredAndSorted = useMemo(() => {
    let filtered = [...transactions]
    if (typeFilter) filtered = filtered.filter((t) => t.transactionType === typeFilter)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((t) => selectedCategories.includes(t.category as InvestmentTransactionCategory))
    }
    filtered.sort((a, b) => {
      const aVal = sortBy === "date" ? new Date(a.transactionDate).getTime() : a.amount
      const bVal = sortBy === "date" ? new Date(b.transactionDate).getTime() : b.amount
      return sortDirection === "ASC" ? aVal - bVal : bVal - aVal
    })
    return filtered
  }, [transactions, typeFilter, selectedCategories, sortBy, sortDirection])

  const effectiveTotalPages = Math.max(Math.ceil(filteredAndSorted.length / PAGE_SIZE), 1)
  const paginationItems = useMemo(
    () => buildPaginationItems(page, effectiveTotalPages),
    [page, effectiveTotalPages]
  )
  const paginatedTransactions = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredAndSorted.slice(start, start + PAGE_SIZE)
  }, [filteredAndSorted, page])

  const rangeStart = filteredAndSorted.length === 0 ? 0 : page * PAGE_SIZE + 1
  const rangeEnd = filteredAndSorted.length === 0 ? 0 : Math.min(filteredAndSorted.length, (page + 1) * PAGE_SIZE)

  const directionLabels =
    sortBy === "amount"
      ? { ASC: "Lowest first", DESC: "Highest first" }
      : { ASC: "Oldest first", DESC: "Newest first" }

  const showReset =
    typeFilter !== "" ||
    selectedCategories.length > 0 ||
    sortBy !== DEFAULT_SORT_BY ||
    sortDirection !== DEFAULT_SORT_DIRECTION

  const appliedFiltersDescription = useMemo(() => {
    const parts: string[] = []
    if (appliedFilters.transactionTypes && appliedFilters.transactionTypes.length > 0) {
      parts.push(`Type: ${appliedFilters.transactionTypes.join(", ")}`)
    }
    if (appliedFilters.categories && appliedFilters.categories.length > 0) {
      parts.push(`Category: ${appliedFilters.categories.join(", ")}`)
    }
    if (appliedFilters.tickers && appliedFilters.tickers.length > 0) {
      parts.push(`Ticker: ${appliedFilters.tickers.join(", ")}`)
    }
    if (appliedFilters.startDate && appliedFilters.endDate) {
      const s = new Date(appliedFilters.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      const e = new Date(appliedFilters.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      parts.push(`${s} – ${e}`)
    }
    return parts.join(" • ") || undefined
  }, [appliedFilters])

  const handleReset = () => {
    setTypeFilter("")
    setSelectedCategories([])
    setSortBy(DEFAULT_SORT_BY)
    setSortDirection(DEFAULT_SORT_DIRECTION)
    setPage(0)
  }

  const colSpan = showTradeColumns ? 11 : 7

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Investment Transactions</DialogTitle>
          {appliedFiltersDescription && (
            <DialogDescription>{appliedFiltersDescription}</DialogDescription>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter((v as TypeFilter) ?? "")
                setSelectedCategories([])
                setPage(0)
              }}
            >
              <ToggleGroupItem value="">All</ToggleGroupItem>
              <ToggleGroupItem value="TRANSFER">Transfer</ToggleGroupItem>
              <ToggleGroupItem value="TRADE">Trade</ToggleGroupItem>
            </ToggleGroup>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <ListFilter data-icon="inline-start" />
                  {selectedCategories.length > 0
                    ? `Category (${selectedCategories.length})`
                    : "Category"}
                  <ChevronDown data-icon="inline-end" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search categories…" />
                  <CommandList>
                    <CommandEmpty>No categories found.</CommandEmpty>
                    <CommandGroup>
                      {availableCategories.map((opt) => {
                        const selected = selectedCategories.includes(opt.value)
                        return (
                          <CommandItem
                            key={opt.value}
                            value={opt.value}
                            onSelect={() => {
                              setSelectedCategories((prev) =>
                                selected
                                  ? prev.filter((c) => c !== opt.value)
                                  : [...prev, opt.value]
                              )
                              setPage(0)
                            }}
                          >
                            <Checkbox checked={selected} aria-label={opt.label} />
                            <span>{opt.label}</span>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                    disabled={selectedCategories.length === 0}
                    onClick={() => { setSelectedCategories([]); setPage(0) }}
                  >
                    Clear
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-2">
              <Select
                value={sortBy}
                onValueChange={(v) => { setSortBy(v as SortBy); setPage(0) }}
              >
                <SelectTrigger size="sm" className="w-[130px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                value={sortDirection}
                onValueChange={(v) => { setSortDirection(v as SortDirection); setPage(0) }}
              >
                <SelectTrigger size="sm" className="w-[130px]">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value="DESC">{directionLabels.DESC}</SelectItem>
                    <SelectItem value="ASC">{directionLabels.ASC}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {showReset && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X data-icon="inline-start" />
                Reset
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto px-2">
          <TooltipProvider>
            <Table className={cn("table-fixed", showTradeColumns ? "min-w-[1200px]" : "min-w-[900px]")}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Transaction ID</TableHead>
                  <TableHead className="w-[130px]">Type</TableHead>
                  <TableHead className="w-[150px]">Category</TableHead>
                  <TableHead className="w-[130px]">Date</TableHead>
                  <TableHead className="w-[130px] pr-4">Amount</TableHead>
                  {showTradeColumns && (
                    <>
                      <TableHead className="w-[100px]">Symbol</TableHead>
                      <TableHead className="w-[90px]">Qty</TableHead>
                      <TableHead className="w-[120px]">Price/Share</TableHead>
                      <TableHead className="w-[120px]">Realized P/L</TableHead>
                    </>
                  )}
                  <TableHead className="w-[220px] pl-4">Description</TableHead>
                  <TableHead className="w-[100px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-muted-foreground">
                        #{transaction.id}
                      </TableCell>
                      <TableCell>
                        <InvestmentTransactionTypeBadge
                          type={transaction.transactionType as InvestmentTransactionType}
                        />
                      </TableCell>
                      <TableCell>
                        <InvestmentTransactionCategoryBadge
                          category={transaction.category as InvestmentTransactionCategory}
                        />
                      </TableCell>
                      <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                      <TableCell
                        className={cn(
                          "pr-4 tabular-nums font-medium",
                          isInflow(transaction.category)
                            ? "text-emerald-600 dark:text-emerald-500"
                            : "text-rose-600 dark:text-rose-500"
                        )}
                      >
                        {formatCurrency(getSignedAmount(transaction.amount, transaction.category))}
                      </TableCell>
                      {showTradeColumns && (
                        <>
                          <TableCell className="font-mono text-xs">
                            {transaction.ticker ?? <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {transaction.quantity != null
                              ? transaction.quantity.toLocaleString("en-US")
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {transaction.pricePerShare != null
                              ? formatCurrency(transaction.pricePerShare)
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "tabular-nums font-medium",
                              transaction.realizedProfitLoss != null && transaction.realizedProfitLoss >= 0
                                ? "text-emerald-600 dark:text-emerald-500"
                                : "text-rose-600 dark:text-rose-500"
                            )}
                          >
                            {transaction.realizedProfitLoss != null
                              ? `${transaction.realizedProfitLoss >= 0 ? "+" : "−"}${formatCurrency(Math.abs(transaction.realizedProfitLoss))}`
                              : <span className="text-muted-foreground font-normal">—</span>}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block max-w-[200px] truncate pl-4">
                              {transaction.description || "—"}
                            </span>
                          </TooltipTrigger>
                          {transaction.description && (
                            <TooltipContent>{transaction.description}</TooltipContent>
                          )}
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/investment-account/transactions/${transaction.id}`)}
                        >
                          Details
                          <ArrowRight data-icon="inline-end" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={colSpan} className="py-12">
                      <div className="text-center">
                        <InboxIcon className="mx-auto size-10 text-muted-foreground" />
                        <p className="mt-3 text-sm text-muted-foreground">No transactions found.</p>
                        {(typeFilter || selectedCategories.length > 0) && (
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your filters.
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>

        <div className="flex flex-row items-center justify-between gap-3 border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">
            {filteredAndSorted.length === 0
              ? "No transactions"
              : `Showing ${rangeStart}–${rangeEnd} of ${filteredAndSorted.length}${hasMoreResults ? ` (${totalCount} total)` : ""}`}
          </p>

          <div className="flex items-center gap-3">
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={page === 0}
                    className={cn(page === 0 && "pointer-events-none opacity-50")}
                    onClick={(e) => { e.preventDefault(); if (page > 0) setPage((p) => p - 1) }}
                  />
                </PaginationItem>
                {paginationItems.map((item, idx) => (
                  <PaginationItem key={`${item}-${idx}`}>
                    {item === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        isActive={item === page + 1}
                        onClick={(e) => { e.preventDefault(); setPage(item - 1) }}
                      >
                        {item}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={page >= effectiveTotalPages - 1}
                    className={cn(page >= effectiveTotalPages - 1 && "pointer-events-none opacity-50")}
                    onClick={(e) => { e.preventDefault(); if (page < effectiveTotalPages - 1) setPage((p) => p + 1) }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            <Button variant="outline" size="sm" asChild>
              <Link href="/investment-account/transactions">
                View all transactions
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
