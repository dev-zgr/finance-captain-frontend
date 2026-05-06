"use client"

import { useState, useMemo } from "react"
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
import { TransactionTypeBadge } from "@/components/components/checking-account/transaction-type-badge"
import { TransactionCategoryBadge } from "@/components/components/checking-account/transaction-category-badge"
import {
  EXPENSE_CATEGORIES_WITH_LABELS,
  INCOME_CATEGORIES_WITH_LABELS,
} from "@/lib/checking-account/constants"
import { cn } from "@/lib/utils"
import type { CheckingTransactionListPayload } from "@/lib/co-captain/types"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return dateString
  }
}

const getSignedAmount = (amount: number, type: string) =>
  type === "INCOME" ? amount : -amount

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

const PAGE_SIZE = 10
type SortBy = "date" | "amount"
type SortDirection = "ASC" | "DESC"
const DEFAULT_SORT_BY: SortBy = "date"
const DEFAULT_SORT_DIRECTION: SortDirection = "DESC"

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
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<SortBy>(DEFAULT_SORT_BY)
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_SORT_DIRECTION)
  const [typeFilter, setTypeFilter] = useState<"" | "INCOME" | "EXPENSE">("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const transactions = payload.transactions ?? []
  const totalCount = payload.totalCount ?? 0
  const displayedCount = payload.displayedCount ?? 0
  const appliedFilters = payload.appliedFilters ?? {
    transactionType: null,
    category: null,
    startDate: null,
    endDate: null,
  }

  const hasMoreResults = totalCount > displayedCount

  const availableCategories = useMemo(() => {
    if (typeFilter === "INCOME") return INCOME_CATEGORIES_WITH_LABELS
    if (typeFilter === "EXPENSE") return EXPENSE_CATEGORIES_WITH_LABELS
    const merged = [...EXPENSE_CATEGORIES_WITH_LABELS, ...INCOME_CATEGORIES_WITH_LABELS]
    const map = new Map<string, { value: string; label: string }>()
    merged.forEach((e) => { if (!map.has(e.value)) map.set(e.value, e) })
    return [...map.values()]
  }, [typeFilter])

  const filteredAndSorted = useMemo(() => {
    let filtered = [...transactions]
    if (typeFilter) filtered = filtered.filter((t) => t.transactionType === typeFilter)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((t) => t.category && selectedCategories.includes(t.category))
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

  const transactionPageUrl = useMemo(() => buildQueryParams(appliedFilters), [appliedFilters])

  const appliedFiltersDescription = useMemo(() => {
    const parts: string[] = []
    if (appliedFilters.transactionType) parts.push(`Type: ${appliedFilters.transactionType}`)
    if (appliedFilters.category) parts.push(`Category: ${appliedFilters.category}`)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Checking Transactions</DialogTitle>
          {appliedFiltersDescription && (
            <DialogDescription>{appliedFiltersDescription}</DialogDescription>
          )}

          {/* Filter controls — matches transactions page layout */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter((v as "" | "INCOME" | "EXPENSE") ?? "")
                setSelectedCategories([])
                setPage(0)
              }}
            >
              <ToggleGroupItem value="">All</ToggleGroupItem>
              <ToggleGroupItem value="INCOME">Income</ToggleGroupItem>
              <ToggleGroupItem value="EXPENSE">Expense</ToggleGroupItem>
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
              <PopoverContent className="w-72 p-0" align="start">
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

        {/* Table */}
        <div className="flex-1 overflow-auto px-2">
          <TooltipProvider>
            <Table className="table-fixed min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Transaction ID</TableHead>
                  <TableHead className="w-[130px]">Type</TableHead>
                  <TableHead className="w-[160px]">Category</TableHead>
                  <TableHead className="w-[130px]">Date</TableHead>
                  <TableHead className="w-[130px] pr-4">Amount</TableHead>
                  <TableHead className="w-[240px] pl-4">Description</TableHead>
                  <TableHead className="w-[100px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-muted-foreground">
                        {transaction.id}
                      </TableCell>
                      <TableCell>
                        <TransactionTypeBadge
                          transactionType={transaction.transactionType as "INCOME" | "EXPENSE"}
                          category={transaction.category ?? "OTHER"}
                        />
                      </TableCell>
                      <TableCell>
                        {transaction.category ? (
                          <TransactionCategoryBadge category={transaction.category} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                      <TableCell
                        className={cn(
                          "pr-4 tabular-nums font-medium",
                          transaction.transactionType === "EXPENSE"
                            ? "text-red-600"
                            : "text-emerald-600"
                        )}
                      >
                        {formatCurrency(getSignedAmount(transaction.amount, transaction.transactionType))}
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block max-w-[220px] truncate pl-4">
                              {transaction.description || "—"}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{transaction.description}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/checking-account/transactions/${transaction.id}`)}
                        >
                          Details
                          <ArrowRight data-icon="inline-end" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12">
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

        <div className="flex flex-row items-center justify-end gap-3 border-t px-6 py-4">
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
            <a href={transactionPageUrl}>
              View all transactions
              <ArrowRight data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
