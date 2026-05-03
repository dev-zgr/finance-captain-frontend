"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { format, parseISO } from "date-fns"
import type { DateRange } from "react-day-picker"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Inbox,
  ListFilter,
  X,
} from "lucide-react"

import { ChartDateRangePicker } from "@/components/components/checking-account/chart-date-range-picker"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  extractInvestmentTransactionsResponse,
  getInvestmentTransactions,
} from "@/lib/investment-account/api"
import type {
  InvestmentApiErrorResponse,
  InvestmentSortBy,
  InvestmentTransactionCategory,
  InvestmentTransactionRow,
  InvestmentTransactionType,
} from "@/lib/investment-account/types"
import type { RootState } from "@/lib/store"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10
const DEFAULT_SORT_BY: InvestmentSortBy = "date"
const DEFAULT_SORT_DIRECTION: "ASC" | "DESC" = "DESC"
const DEFAULT_TYPE_FILTER: "" | InvestmentTransactionType = ""
const DEFAULT_CATEGORY_FILTER: "" | InvestmentTransactionCategory = ""

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function getErrorMessage(
  status: number,
  payload?: InvestmentApiErrorResponse
): string {
  if (status === 400) {
    return payload?.message ?? "Invalid filter parameters."
  }

  if (status === 401) {
    return payload?.message ?? "Your session has expired. Please log in again."
  }

  if (status === 500) {
    return payload?.message ?? "Could not load transactions. Please try again."
  }

  return payload?.message ?? "Could not load transactions. Please try again."
}

function formatDateValue(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy")
  } catch {
    return value
  }
}

function formatSignedAmount(
  amount: number,
  category: InvestmentTransactionCategory
): string {
  if (category === "BUY" || category === "SELL") {
    return currencyFormatter.format(Math.abs(amount))
  }

  const sign = category === "DEPOSIT" ? "+" : "−"
  return `${sign}${currencyFormatter.format(Math.abs(amount))}`
}

function formatSignedProfitLoss(value: number): string {
  const sign = value >= 0 ? "+" : "−"
  return `${sign}${currencyFormatter.format(Math.abs(value))}`
}

function buildPaginationItems(
  currentPage: number,
  totalPages: number
): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const current = currentPage + 1
  const pages = new Set<number>([
    1,
    totalPages,
    current - 1,
    current,
    current + 1,
  ])
  const sortedPages = [...pages]
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((a, b) => a - b)
  const result: Array<number | "ellipsis"> = []

  sortedPages.forEach((pageNumber, index) => {
    if (index > 0 && pageNumber - sortedPages[index - 1] > 1) {
      result.push("ellipsis")
    }
    result.push(pageNumber)
  })

  return result
}

export function InvestmentTransactionsTable() {
  const router = useRouter()
  const token = useSelector(
    (state: RootState) => state.auth.content?.token ?? ""
  )
  const abortControllerRef = useRef<AbortController | null>(null)

  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<InvestmentSortBy>(DEFAULT_SORT_BY)
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">(
    DEFAULT_SORT_DIRECTION
  )
  const [typeFilter, setTypeFilter] = useState<"" | InvestmentTransactionType>(
    DEFAULT_TYPE_FILTER
  )
  const [categoryFilter, setCategoryFilter] = useState<
    "" | InvestmentTransactionCategory
  >(DEFAULT_CATEGORY_FILTER)
  const [selectedTickers, setSelectedTickers] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [transactions, setTransactions] = useState<InvestmentTransactionRow[]>([])
  const [availableTickers, setAvailableTickers] = useState<string[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const tickerFilterDisabled =
    typeFilter === "TRANSFER" ||
    categoryFilter === "DEPOSIT" ||
    categoryFilter === "WITHDRAW"
  const showTickerFilter = !tickerFilterDisabled
  const showTradeColumns = typeFilter !== "TRANSFER"

  const hasActiveFilters = Boolean(
    typeFilter ||
      categoryFilter ||
      selectedTickers.length > 0 ||
      dateRange?.from ||
      dateRange?.to ||
      debouncedSearch
  )

  const showReset = useMemo(
    () =>
      typeFilter !== DEFAULT_TYPE_FILTER ||
      categoryFilter !== DEFAULT_CATEGORY_FILTER ||
      selectedTickers.length > 0 ||
      Boolean(dateRange?.from || dateRange?.to) ||
      Boolean(debouncedSearch) ||
      sortBy !== DEFAULT_SORT_BY ||
      sortDirection !== DEFAULT_SORT_DIRECTION,
    [
      categoryFilter,
      dateRange?.from,
      dateRange?.to,
      debouncedSearch,
      selectedTickers.length,
      sortBy,
      sortDirection,
      typeFilter,
    ]
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setPage(0)
    }, 300)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [searchTerm])

  const fetchTransactions = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await getInvestmentTransactions(
        token,
        {
          page,
          sortBy,
          sortDirection,
          ...(typeFilter && { transactionTypes: [typeFilter] }),
          ...(categoryFilter && { categories: [categoryFilter] }),
          ...(selectedTickers.length > 0 && { tickers: selectedTickers }),
          ...(dateRange?.from && {
            startDate: format(dateRange.from, "yyyy-MM-dd"),
          }),
          ...(dateRange?.to && { endDate: format(dateRange.to, "yyyy-MM-dd") }),
          ...(debouncedSearch && { q: debouncedSearch }),
        },
        controller.signal
      )

      if (controller.signal.aborted) {
        return
      }

      if (response.status === 200) {
        setSessionExpired(false)
        const payload = extractInvestmentTransactionsResponse(response.data)
        const rows = payload?.items ?? []

        setTransactions(rows)
        setTotalPages(payload?.totalPages ?? 0)
        setTotalElements(payload?.totalElements ?? 0)

        setAvailableTickers((current) => {
          const next = new Map<string, string | null>()
          current.forEach((entry) => {
            next.set(entry, null)
          })
          rows.forEach((row) => {
            if (row.ticker) {
              next.set(row.ticker, row.symbolUrl ?? null)
            }
          })
          return [...next.keys()].sort((a, b) => a.localeCompare(b))
        })
        return
      }

      if (response.status === 204) {
        setSessionExpired(false)
        setTransactions([])
        setTotalPages(0)
        setTotalElements(0)
        return
      }

      const body = response.data as InvestmentApiErrorResponse
      if (response.status === 401) {
        setSessionExpired(true)
      }

      setTransactions([])
      setTotalPages(0)
      setTotalElements(0)
      setErrorMessage(getErrorMessage(response.status, body))
    } catch {
      if (controller.signal.aborted) {
        return
      }

      setTransactions([])
      setTotalPages(0)
      setTotalElements(0)
      setErrorMessage("Could not load transactions. Please try again.")
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false)
      }
    }
  }, [
    categoryFilter,
    dateRange?.from,
    dateRange?.to,
    debouncedSearch,
    page,
    selectedTickers,
    sortBy,
    sortDirection,
    token,
    typeFilter,
  ])

  useEffect(() => {
    void fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (totalPages > 0 && page > totalPages - 1) {
      setPage(totalPages - 1)
    }
  }, [page, totalPages])

  const columns = useMemo<ColumnDef<InvestmentTransactionRow>[]>(
    () => {
      const baseColumns: ColumnDef<InvestmentTransactionRow>[] = [
      {
        accessorKey: "transactionId",
        header: "Tx ID",
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground">
            #{row.original.transactionId}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => (
          <InvestmentTransactionTypeBadge
            type={row.original.investmentTransactionType}
          />
        ),
      },
      {
        accessorKey: "investmentTransactionCategory",
        header: "Category",
        cell: ({ row }) => (
          <InvestmentTransactionCategoryBadge
            category={row.original.investmentTransactionCategory}
          />
        ),
      },
      {
        accessorKey: "transactionDate",
        header: "Date",
        cell: ({ row }) => formatDateValue(row.original.transactionDate),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <div
            className={cn(
              "pr-2 font-medium tabular-nums",
              row.original.investmentTransactionCategory === "BUY"
                ? "text-emerald-600"
                : row.original.investmentTransactionCategory === "SELL"
                  ? "text-rose-600"
                  : row.original.investmentTransactionCategory === "DEPOSIT"
                    ? "text-emerald-600"
                    : "text-rose-600"
            )}
          >
            {formatSignedAmount(
              Number(row.original.amount ?? 0),
              row.original.investmentTransactionCategory
            )}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
          const description = row.original.description?.trim() || "—"
          return <span className="block whitespace-normal break-words">{description}</span>
        },
      },
      {
        id: "actions",
        header: "Details",
        cell: ({ row }) => (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(
                  `/investment-account/transactions/${row.original.transactionId}`
                )
              }
            >
              Details
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        ),
      },
    ]

      const tradeColumns: ColumnDef<InvestmentTransactionRow>[] = [
        {
          accessorKey: "ticker",
          header: "Symbol",
          cell: ({ row }) => {
            const ticker = row.original.ticker
            if (!ticker) {
              return <span className="text-muted-foreground">—</span>
            }

            return (
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  <AvatarImage
                    src={
                      row.original.companyLogoUrl ??
                      row.original.symbolUrl ??
                      undefined
                    }
                    alt={`${ticker} logo`}
                  />
                  <AvatarFallback>{ticker.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{ticker}</span>
              </div>
            )
          },
        },
        {
          accessorKey: "quantity",
          header: "Quantity",
          cell: ({ row }) =>
            row.original.quantity != null
              ? String(Math.trunc(row.original.quantity))
              : "—",
        },
        {
          accessorKey: "pricePerShare",
          header: "Price / Share",
          cell: ({ row }) =>
            row.original.pricePerShare != null
              ? currencyFormatter.format(row.original.pricePerShare)
              : "—",
        },
        {
          accessorKey: "realizedProfitLoss",
          header: "Realized P/L",
          cell: ({ row }) => {
            const realizedProfitLoss = row.original.realizedProfitLoss

            if (
              row.original.investmentTransactionCategory !== "SELL" ||
              realizedProfitLoss == null
            ) {
              return <span className="text-muted-foreground">—</span>
            }

            return (
              <span
                className={cn(
                  "font-medium tabular-nums",
                  realizedProfitLoss >= 0 ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {formatSignedProfitLoss(realizedProfitLoss)}
              </span>
            )
          },
        },
      ]

      const insertIndex = 5
      return showTradeColumns
        ? [
            ...baseColumns.slice(0, insertIndex),
            ...tradeColumns,
            ...baseColumns.slice(insertIndex),
          ]
        : baseColumns
    },
    [router, showTradeColumns]
  )

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const effectiveTotalPages = Math.max(totalPages, 1)
  const paginationItems = useMemo(
    () => buildPaginationItems(page, effectiveTotalPages),
    [effectiveTotalPages, page]
  )

  const start = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const end =
    totalElements === 0
      ? 0
      : Math.min(totalElements, page * PAGE_SIZE + transactions.length)

  const directionLabels =
    sortBy === "amount"
      ? { ASC: "Lowest first", DESC: "Highest first" }
      : { ASC: "Oldest first", DESC: "Newest first" }

  const typeOptions: Array<{ value: "" | InvestmentTransactionType; label: string }> =
    [
      { value: "", label: "All" },
      ...(categoryFilter === "BUY" || categoryFilter === "SELL"
        ? [
            { value: "TRADE" as const, label: "Trade" },
          ]
        : categoryFilter === "DEPOSIT" || categoryFilter === "WITHDRAW"
          ? [
              { value: "TRANSFER" as const, label: "Transfer" },
            ]
          : [
              { value: "TRANSFER" as const, label: "Transfer" },
              { value: "TRADE" as const, label: "Trade" },
            ]),
    ]

  const categoryOptions: Array<{
    value: "" | InvestmentTransactionCategory
    label: string
  }> = [
    { value: "", label: "All" },
    ...(typeFilter === "TRADE"
      ? [
          { value: "BUY" as const, label: "Buy" },
          { value: "SELL" as const, label: "Sell" },
        ]
      : typeFilter === "TRANSFER"
        ? [
            { value: "DEPOSIT" as const, label: "Deposit" },
            { value: "WITHDRAW" as const, label: "Withdraw" },
          ]
        : [
            { value: "DEPOSIT" as const, label: "Deposit" },
            { value: "WITHDRAW" as const, label: "Withdraw" },
            { value: "BUY" as const, label: "Buy" },
            { value: "SELL" as const, label: "Sell" },
          ]),
  ]

  return (
    <TooltipProvider>
      <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden">
        {sessionExpired ? (
          <Card role="alert" className="border-destructive/30">
            <CardContent className="flex items-center gap-2 py-3 text-sm text-destructive">
              <AlertCircle />
              Your session has expired. Please log in again.
            </CardContent>
          </Card>
        ) : null}

        <Card className="flex h-full min-w-0 w-full max-w-full flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>Investment Account Transactions</CardTitle>
            <CardDescription>
              Your full investment transfers and trades history.
            </CardDescription>
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={typeFilter}
                onValueChange={(nextType) => {
                  const value = (nextType as "" | InvestmentTransactionType) ?? ""
                  setTypeFilter(value)

                  if (value === "TRANSFER") {
                    setCategoryFilter("")
                    setSelectedTickers([])
                  } else if (value === "TRADE") {
                    setCategoryFilter("")
                  }

                  if (!value) {
                    setCategoryFilter("")
                  }

                  setPage(0)
                }}
              >
                {typeOptions.map((option) => (
                  <ToggleGroupItem key={option.label} value={option.value}>
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={categoryFilter}
                onValueChange={(nextCategory) => {
                  const value =
                    (nextCategory as "" | InvestmentTransactionCategory) ?? ""
                  setCategoryFilter(value)

                  if (value === "DEPOSIT" || value === "WITHDRAW") {
                    setSelectedTickers([])
                    if (typeFilter === "TRADE") {
                      setTypeFilter("")
                    }
                  }

                  if (value === "BUY" || value === "SELL") {
                    if (typeFilter === "TRANSFER") {
                      setTypeFilter("")
                    }
                  }

                  setPage(0)
                }}
              >
                {categoryOptions.map((option) => (
                  <ToggleGroupItem key={option.label} value={option.value}>
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              {showTickerFilter ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <span>
                      <Button variant="outline" size="sm">
                        <ListFilter data-icon="inline-start" />
                        {selectedTickers.length > 0
                          ? `Tickers (${selectedTickers.length})`
                          : "Tickers"}
                        <ChevronDown data-icon="inline-end" />
                      </Button>
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search tickers..." />
                      <CommandList>
                        <CommandEmpty>No tickers found.</CommandEmpty>
                        <CommandGroup>
                          {availableTickers.map((ticker) => {
                            const selected = selectedTickers.includes(ticker)

                            return (
                              <CommandItem
                                key={ticker}
                                value={ticker}
                                onSelect={() => {
                                  setSelectedTickers((prev) =>
                                    selected
                                      ? prev.filter((item) => item !== ticker)
                                      : [...prev, ticker]
                                  )
                                  setPage(0)
                                }}
                              >
                                <Checkbox checked={selected} aria-label={ticker} />
                                <span>{ticker}</span>
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
                        disabled={selectedTickers.length === 0}
                        onClick={() => {
                          setSelectedTickers([])
                          setPage(0)
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : null}

              <ChartDateRangePicker
                className="w-[260px]"
                value={dateRange}
                onChange={(nextRange) => {
                  setDateRange(nextRange)
                  setPage(0)
                }}
                onClear={() => {
                  setDateRange(undefined)
                  setPage(0)
                }}
              />

              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-8 w-[220px]"
                placeholder="Search transactions..."
              />

              <div className="flex items-center gap-2">
                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    setSortBy(value as InvestmentSortBy)
                    setPage(0)
                  }}
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
                  onValueChange={(value) => {
                    setSortDirection(value as "ASC" | "DESC")
                    setPage(0)
                  }}
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

              {showReset ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTypeFilter(DEFAULT_TYPE_FILTER)
                    setCategoryFilter(DEFAULT_CATEGORY_FILTER)
                    setSelectedTickers([])
                    setDateRange(undefined)
                    setSearchTerm("")
                    setDebouncedSearch("")
                    setSortBy(DEFAULT_SORT_BY)
                    setSortDirection(DEFAULT_SORT_DIRECTION)
                    setPage(0)
                  }}
                >
                  <X data-icon="inline-start" />
                  Reset
                </Button>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="flex min-h-[60vh] min-w-0 max-w-full flex-1 flex-col overflow-x-auto">
            {errorMessage ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
                <AlertCircle className="size-8 text-destructive" />
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchTransactions()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="min-w-0 max-w-full">
                  <Table className="min-w-[980px] table-fixed">
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header, index) => {
                            const className = cn(
                              index === 0 && "w-[100px]",
                              index === 1 && "w-[140px]",
                              index === 2 && "w-[130px]",
                              index === 3 && "w-[130px]",
                              index === 4 && "w-[140px]",
                              index === 5 && (showTradeColumns ? "w-[150px]" : "w-[260px]"),
                              index === 6 && (showTradeColumns ? "w-[130px]" : "w-[110px]"),
                              index === 7 && showTradeColumns && "w-[130px]",
                              index === 8 && showTradeColumns && "w-[140px]",
                              index === 9 && showTradeColumns && "w-[260px]",
                              index === 10 && showTradeColumns && "w-[110px]"
                            )

                            return (
                              <TableHead key={header.id} className={className}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </TableHead>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: PAGE_SIZE }, (_, rowIndex) => (
                          <TableRow key={`skeleton-${rowIndex}`}>
                            {Array.from(
                              { length: columns.length },
                              (_, cellIndex) => (
                                <TableCell key={`${rowIndex}-${cellIndex}`}>
                                  <Skeleton className="h-4 w-full" />
                                </TableCell>
                              )
                            )}
                          </TableRow>
                        ))
                      ) : table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="py-12">
                            <Empty className="border-0 p-0">
                              <EmptyHeader>
                                <EmptyMedia variant="icon">
                                  <Inbox />
                                </EmptyMedia>
                                <EmptyTitle>
                                  No investment transactions found
                                </EmptyTitle>
                                <EmptyDescription>
                                  {hasActiveFilters
                                    ? "Try adjusting your filters."
                                    : "No investment activity yet."}
                                </EmptyDescription>
                              </EmptyHeader>
                            </Empty>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalElements > 0 ? (
                  <div className="mt-auto flex flex-col items-end gap-2 pt-4">
                    <Pagination className="justify-end">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            aria-disabled={page === 0 || totalPages === 0}
                            className={cn(
                              (page === 0 || totalPages === 0) &&
                                "pointer-events-none opacity-50"
                            )}
                            onClick={(event) => {
                              event.preventDefault()
                              if (page > 0 && totalPages > 0) {
                                setPage((prev) => prev - 1)
                              }
                            }}
                          />
                        </PaginationItem>
                        {paginationItems.map((item, index) => (
                          <PaginationItem key={`${item}-${index}`}>
                            {item === "ellipsis" ? (
                              <PaginationEllipsis />
                            ) : (
                              <PaginationLink
                                href="#"
                                isActive={item === page + 1}
                                className={cn(
                                  totalPages === 0 &&
                                    "pointer-events-none opacity-50"
                                )}
                                onClick={(event) => {
                                  event.preventDefault()
                                  if (totalPages > 0) {
                                    setPage(item - 1)
                                  }
                                }}
                              >
                                {item}
                              </PaginationLink>
                            )}
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            aria-disabled={
                              page >= effectiveTotalPages - 1 || totalPages === 0
                            }
                            className={cn(
                              (page >= effectiveTotalPages - 1 ||
                                totalPages === 0) &&
                                "pointer-events-none opacity-50"
                            )}
                            onClick={(event) => {
                              event.preventDefault()
                              if (
                                page < effectiveTotalPages - 1 &&
                                totalPages > 0
                              ) {
                                setPage((prev) => prev + 1)
                              }
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    <p className="text-xs text-muted-foreground">
                      Showing {start}–{end} of {totalElements}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
