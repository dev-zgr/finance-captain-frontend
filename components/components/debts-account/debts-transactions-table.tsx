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
  InboxIcon,
  ListFilter,
  X,
} from "lucide-react"

import { ChartDateRangePicker } from "@/components/components/checking-account/chart-date-range-picker"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DEBT_CATEGORIES_WITH_LABELS,
  type DebtCategory,
} from "@/lib/debts-account/constants"
import {
  extractDebtsTransactionsResponse,
  getDebtsTransactions,
} from "@/lib/debts-account/api"
import type {
  DebtsApiErrorResponse,
  DebtsSortBy,
  DebtsTransactionRow,
  DebtsTransactionType,
} from "@/lib/debts-account/types"
import type { RootState } from "@/lib/store"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10
const DEFAULT_SORT_BY: DebtsSortBy = "date"
const DEFAULT_SORT_DIRECTION: "ASC" | "DESC" = "DESC"
const DEFAULT_TYPE_FILTER: "" | DebtsTransactionType = ""
const COLUMNS_COUNT = 7

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function getErrorMessage(
  status: number,
  payload?: DebtsApiErrorResponse
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
  transactionType: DebtsTransactionType
): string {
  const sign = transactionType === "PAYMENT" ? "+" : "−"
  return `${sign}${currencyFormatter.format(Math.abs(amount))}`
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
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
  const result: Array<number | "ellipsis"> = []

  sortedPages.forEach((page, index) => {
    if (index > 0 && page - sortedPages[index - 1] > 1) {
      result.push("ellipsis")
    }
    result.push(page)
  })

  return result
}

export function DebtsTransactionsTable() {
  const router = useRouter()
  const token = useSelector(
    (state: RootState) => state.auth.content?.token ?? ""
  )
  const abortControllerRef = useRef<AbortController | null>(null)
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<DebtsSortBy>(DEFAULT_SORT_BY)
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">(
    DEFAULT_SORT_DIRECTION
  )
  const [typeFilter, setTypeFilter] = useState<"" | DebtsTransactionType>(
    DEFAULT_TYPE_FILTER
  )
  const [selectedCategories, setSelectedCategories] = useState<DebtCategory[]>(
    []
  )
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<DebtsTransactionRow[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const categoryFilterDisabled = typeFilter === "PAYMENT"
  const hasActiveFilters = Boolean(
    typeFilter ||
    selectedCategories.length > 0 ||
    dateRange?.from ||
    dateRange?.to
  )

  const showReset = useMemo(
    () =>
      typeFilter !== DEFAULT_TYPE_FILTER ||
      selectedCategories.length > 0 ||
      Boolean(dateRange?.from || dateRange?.to) ||
      sortBy !== DEFAULT_SORT_BY ||
      sortDirection !== DEFAULT_SORT_DIRECTION,
    [
      dateRange?.from,
      dateRange?.to,
      selectedCategories.length,
      sortBy,
      sortDirection,
      typeFilter,
    ]
  )

  const fetchTransactions = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await getDebtsTransactions(
        token,
        {
          page,
          sortBy,
          sortDirection,
          ...(dateRange?.from && {
            startDate: format(dateRange.from, "yyyy-MM-dd"),
          }),
          ...(dateRange?.to && { endDate: format(dateRange.to, "yyyy-MM-dd") }),
          ...(selectedCategories.length > 0 && {
            category: selectedCategories,
          }),
          ...(typeFilter && { transactionType: typeFilter }),
        },
        controller.signal
      )

      if (controller.signal.aborted) {
        return
      }

      if (response.status === 200) {
        const payload = extractDebtsTransactionsResponse(response.data)
        setTransactions(payload?.transactions ?? [])
        setTotalPages(payload?.totalPages ?? 0)
        setTotalElements(payload?.totalElements ?? 0)
        return
      }

      if (response.status === 204) {
        setTransactions([])
        setTotalPages(0)
        setTotalElements(0)
        return
      }

      const body = response.data as DebtsApiErrorResponse
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
    dateRange?.from,
    dateRange?.to,
    page,
    selectedCategories,
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

  const columns = useMemo<ColumnDef<DebtsTransactionRow>[]>(
    () => [
      {
        accessorKey: "debtsTransactionId",
        header: "Transaction ID",
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground">
            {row.original.debtsTransactionId}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => (
          <DebtsTransactionTypeBadge
            transactionType={row.original.transactionType}
          />
        ),
      },
      {
        accessorKey: "debtCategory",
        header: "Category",
        cell: ({ row }) => (
          <DebtsCategoryBadge
            category={row.original.debtCategory}
            transactionType={row.original.transactionType}
          />
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => formatDateValue(row.original.date),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <div
            className={cn(
              "pr-4 font-medium tabular-nums",
              row.original.transactionType === "PAYMENT"
                ? "text-emerald-600"
                : "text-red-600"
            )}
          >
            {formatSignedAmount(
              Number(row.original.amount ?? 0),
              row.original.transactionType
            )}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
          const description = row.original.description?.trim() || "—"

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block max-w-[240px] truncate pl-4">
                  {description}
                </span>
              </TooltipTrigger>
              <TooltipContent>{description}</TooltipContent>
            </Tooltip>
          )
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
                  `/debt-account/transactions/${row.original.debtsTransactionId}`
                )
              }
            >
              Details
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
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

  return (
    <TooltipProvider>
      <Card className="flex h-full w-full flex-col">
        <CardHeader>
          <CardTitle>Debts Account Transactions</CardTitle>
          <CardDescription>
            Your full debts and payments history.
          </CardDescription>
          <div className="flex flex-wrap items-center gap-3">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={typeFilter}
              onValueChange={(nextType) => {
                setTypeFilter((nextType as "" | DebtsTransactionType) ?? "")
                setSelectedCategories([])
                setPage(0)
              }}
            >
              <ToggleGroupItem value="">All</ToggleGroupItem>
              <ToggleGroupItem value="DEBT">Debt</ToggleGroupItem>
              <ToggleGroupItem value="PAYMENT">Payment</ToggleGroupItem>
            </ToggleGroup>

            {categoryFilterDisabled ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="outline" size="sm" disabled>
                      <ListFilter data-icon="inline-start" />
                      Categories
                      <ChevronDown data-icon="inline-end" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Payments don&apos;t have a category
                </TooltipContent>
              </Tooltip>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ListFilter data-icon="inline-start" />
                    {selectedCategories.length > 0
                      ? `Categories (${selectedCategories.length})`
                      : "Categories"}
                    <ChevronDown data-icon="inline-end" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search categories..." />
                    <CommandList>
                      <CommandEmpty>No categories found.</CommandEmpty>
                      <CommandGroup>
                        {DEBT_CATEGORIES_WITH_LABELS.map((categoryOption) => {
                          const selected = selectedCategories.includes(
                            categoryOption.value
                          )

                          return (
                            <CommandItem
                              key={categoryOption.value}
                              value={categoryOption.value}
                              onSelect={() => {
                                setSelectedCategories((prev) =>
                                  selected
                                    ? prev.filter(
                                        (item) => item !== categoryOption.value
                                      )
                                    : [...prev, categoryOption.value]
                                )
                                setPage(0)
                              }}
                            >
                              <Checkbox
                                checked={selected}
                                aria-label={categoryOption.label}
                              />
                              <span>{categoryOption.label}</span>
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
                      onClick={() => {
                        setSelectedCategories([])
                        setPage(0)
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

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

            <div className="flex items-center gap-2">
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value as DebtsSortBy)
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
                <SelectTrigger size="sm" className="w-[120px]">
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
                  setSelectedCategories([])
                  setDateRange(undefined)
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

        <CardContent className="flex min-h-[60vh] flex-1 flex-col">
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
            <div className="flex flex-1 flex-col">
              <div className="max-w-full overflow-x-auto">
                <Table className="min-w-[980px] table-fixed">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header, index) => {
                          const className = cn(
                            index === 0 && "w-[140px]",
                            index === 1 && "w-[130px]",
                            index === 2 && "w-[170px]",
                            index === 3 && "w-[130px]",
                            index === 4 && "w-[140px] pr-4",
                            index === 5 && "w-[260px] pl-4",
                            index === 6 && "w-[110px]"
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
                            { length: COLUMNS_COUNT },
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
                        <TableCell colSpan={COLUMNS_COUNT} className="py-12">
                          <Empty className="border-0 p-0">
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <InboxIcon />
                              </EmptyMedia>
                              <EmptyTitle>
                                No debts transactions found
                              </EmptyTitle>
                              <EmptyDescription>
                                {hasActiveFilters
                                  ? "Try adjusting your filters."
                                  : "No debts activity was returned."}
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
    </TooltipProvider>
  )
}
