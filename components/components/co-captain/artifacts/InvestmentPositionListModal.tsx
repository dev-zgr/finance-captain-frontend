"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, InboxIcon, TrendingDown, TrendingUp, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import type { InvestmentPositionListPayload } from "@/lib/co-captain/types"

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

function formatSignedCurrency(value: number) {
  const sign = value >= 0 ? "+" : "−"
  return `${sign}${currencyFormatter.format(Math.abs(value))}`
}

function formatSignedPercent(value: number) {
  const sign = value >= 0 ? "+" : "−"
  return `${sign}${Math.abs(value).toFixed(2)}%`
}

function getPLColor(value: number) {
  if (value > 0) return "text-emerald-600"
  if (value < 0) return "text-rose-600"
  return "text-muted-foreground"
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
const SEARCH_MAX_LENGTH = 16

type GainLossFilter = "ALL" | "GAINERS" | "LOSERS"
type SortBy = "marketValue" | "unrealizedPnl" | "unrealizedPnlPercent" | "dayChange" | "dayChangePercent" | "ticker" | "quantity" | "averageBuyPrice"
type SortDirection = "ASC" | "DESC"

const DEFAULT_SORT_BY: SortBy = "marketValue"
const DEFAULT_SORT_DIRECTION: SortDirection = "DESC"
const DEFAULT_GAIN_LOSS_FILTER: GainLossFilter = "ALL"

const sortOptions: Array<{ value: SortBy; label: string }> = [
  { value: "marketValue", label: "Market Value" },
  { value: "unrealizedPnl", label: "Total Gain/Loss" },
  { value: "unrealizedPnlPercent", label: "Total G/L %" },
  { value: "dayChange", label: "Day Change" },
  { value: "dayChangePercent", label: "Day Change %" },
  { value: "ticker", label: "Ticker" },
  { value: "quantity", label: "Quantity" },
  { value: "averageBuyPrice", label: "Avg Buy Price" },
]

const alphaSortFields = new Set<SortBy>(["ticker"])

export interface InvestmentPositionListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payload: Partial<InvestmentPositionListPayload>
}

export function InvestmentPositionListModal({
  open,
  onOpenChange,
  payload,
}: InvestmentPositionListModalProps) {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<SortBy>(DEFAULT_SORT_BY)
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_SORT_DIRECTION)
  const [gainLossFilter, setGainLossFilter] = useState<GainLossFilter>(DEFAULT_GAIN_LOSS_FILTER)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setPage(0)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchTerm])

  const positions = useMemo(() => payload.positions ?? [], [payload.positions])
  const totalCount = payload.totalCount ?? 0
  const displayedCount = payload.displayedCount ?? 0
  const priceDataPartial = payload.priceDataPartial ?? false
  const appliedFilters = useMemo(
    () => payload.appliedFilters ?? { gainLossFilter: null, q: null },
    [payload.appliedFilters]
  )

  const hasMoreResults = totalCount > displayedCount

  const showReset =
    gainLossFilter !== DEFAULT_GAIN_LOSS_FILTER ||
    debouncedSearch !== "" ||
    sortBy !== DEFAULT_SORT_BY ||
    sortDirection !== DEFAULT_SORT_DIRECTION

  const filteredAndSorted = useMemo(() => {
    let filtered = [...positions]

    if (gainLossFilter === "GAINERS") filtered = filtered.filter((p) => p.unrealizedPnl > 0)
    if (gainLossFilter === "LOSERS") filtered = filtered.filter((p) => p.unrealizedPnl < 0)

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.ticker.toLowerCase().includes(q) ||
          p.companyName.toLowerCase().includes(q)
      )
    }

    filtered.sort((a, b) => {
      if (alphaSortFields.has(sortBy)) {
        const aVal = String(a[sortBy as keyof typeof a] ?? "").toLowerCase()
        const bVal = String(b[sortBy as keyof typeof b] ?? "").toLowerCase()
        return sortDirection === "ASC" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      const aVal = Number(a[sortBy as keyof typeof a] ?? 0)
      const bVal = Number(b[sortBy as keyof typeof b] ?? 0)
      return sortDirection === "ASC" ? aVal - bVal : bVal - aVal
    })

    return filtered
  }, [positions, gainLossFilter, debouncedSearch, sortBy, sortDirection])

  const effectiveTotalPages = Math.max(Math.ceil(filteredAndSorted.length / PAGE_SIZE), 1)
  const paginationItems = useMemo(
    () => buildPaginationItems(page, effectiveTotalPages),
    [page, effectiveTotalPages]
  )
  const paginatedPositions = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredAndSorted.slice(start, start + PAGE_SIZE)
  }, [filteredAndSorted, page])

  const directionLabels = alphaSortFields.has(sortBy)
    ? { ASC: "A→Z", DESC: "Z→A" }
    : { ASC: "Lowest first", DESC: "Highest first" }

  const appliedFiltersDescription = useMemo(() => {
    const parts: string[] = []
    if (appliedFilters.gainLossFilter && appliedFilters.gainLossFilter !== "ALL") {
      parts.push(appliedFilters.gainLossFilter === "GAINERS" ? "Gainers only" : "Losers only")
    }
    if (appliedFilters.q) parts.push(`Search: "${appliedFilters.q}"`)
    return parts.join(" • ") || undefined
  }, [appliedFilters])

  const handleReset = () => {
    setGainLossFilter(DEFAULT_GAIN_LOSS_FILTER)
    setSearchTerm("")
    setDebouncedSearch("")
    setSortBy(DEFAULT_SORT_BY)
    setSortDirection(DEFAULT_SORT_DIRECTION)
    setPage(0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Investment Positions</DialogTitle>
          {appliedFiltersDescription && (
            <DialogDescription>{appliedFiltersDescription}</DialogDescription>
          )}
          {hasMoreResults && (
            <DialogDescription>
              Showing {displayedCount} of {totalCount} positions. View all positions for the complete list.
            </DialogDescription>
          )}

          {priceDataPartial && (
            <Alert className="mt-2">
              <AlertDescription>
                Live prices unavailable for some tickers — values below use cost basis.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={gainLossFilter}
              onValueChange={(v) => {
                setGainLossFilter((v as GainLossFilter) || DEFAULT_GAIN_LOSS_FILTER)
                setPage(0)
              }}
            >
              <ToggleGroupItem value="ALL">All</ToggleGroupItem>
              <ToggleGroupItem value="GAINERS">
                <TrendingUp data-icon="inline-start" />
                Gainers
              </ToggleGroupItem>
              <ToggleGroupItem value="LOSERS">
                <TrendingDown data-icon="inline-start" />
                Losers
              </ToggleGroupItem>
            </ToggleGroup>

            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.slice(0, SEARCH_MAX_LENGTH))}
              className="h-8 w-[200px]"
              placeholder="Search ticker or company..."
              maxLength={SEARCH_MAX_LENGTH}
            />

            <div className="flex items-center gap-2">
              <Select
                value={sortBy}
                onValueChange={(v) => { setSortBy(v as SortBy); setPage(0) }}
              >
                <SelectTrigger size="sm" className="w-[170px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                value={sortDirection}
                onValueChange={(v) => { setSortDirection(v as SortDirection); setPage(0) }}
              >
                <SelectTrigger size="sm" className="w-[140px]">
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
          <Table className="table-fixed min-w-[1060px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[260px]">Symbol</TableHead>
                <TableHead className="w-[100px]">Quantity</TableHead>
                <TableHead className="w-[130px]">Avg Buy Price</TableHead>
                <TableHead className="w-[130px]">Last Price</TableHead>
                <TableHead className="w-[200px]">Changes</TableHead>
                <TableHead className="w-[140px]">Market Value</TableHead>
                <TableHead className="w-[140px]">Total G/L</TableHead>
                <TableHead className="w-[110px]">G/L %</TableHead>
                <TableHead className="w-[130px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPositions.length > 0 ? (
                paginatedPositions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarImage src={position.logoUrl ?? undefined} alt={`${position.ticker} logo`} />
                          <AvatarFallback>{position.ticker.slice(0, 1)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium">{position.ticker}</p>
                          <p className="max-w-[180px] truncate text-xs text-muted-foreground">
                            {position.companyName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{position.quantity}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(position.averageBuyPrice)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(position.currentPrice)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-normal",
                          position.dayChange > 0
                            ? "border-lime-500/30 bg-lime-500/10 text-lime-700 hover:bg-lime-500/10"
                            : position.dayChange < 0
                              ? "border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/10"
                              : "border-muted-foreground/30 bg-muted text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {formatSignedCurrency(position.dayChange)} ({formatSignedPercent(position.dayChangePercent)})
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(position.marketValue)}</TableCell>
                    <TableCell className={cn("font-medium tabular-nums", getPLColor(position.unrealizedPnl))}>
                      {formatSignedCurrency(position.unrealizedPnl)}
                    </TableCell>
                    <TableCell className={cn("font-medium tabular-nums", getPLColor(position.unrealizedPnlPercent))}>
                      {formatSignedPercent(position.unrealizedPnlPercent)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/investment-account/portfolio/${position.id}`)}
                      >
                        Get Details
                        <ArrowRight data-icon="inline-end" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="py-12">
                    <div className="text-center">
                      <InboxIcon className="mx-auto size-10 text-muted-foreground" />
                      <p className="mt-3 text-sm text-muted-foreground">No positions found.</p>
                      {(gainLossFilter !== "ALL" || debouncedSearch) && (
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
            <Link href="/investment-account/portfolio">
              View all positions
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
