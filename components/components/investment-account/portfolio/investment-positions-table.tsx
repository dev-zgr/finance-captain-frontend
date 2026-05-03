"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { AlertCircle, ArrowRight, Inbox, TrendingDown, TrendingUp, X } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
  EmptyContent,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
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
  extractInvestmentPositionsContent,
  getInvestmentPositions,
} from "@/lib/investment-account/api"
import type {
  GainLossFilter,
  InvestmentApiErrorResponse,
  InvestmentPositionsSortBy,
  PositionTableRow,
} from "@/lib/investment-account/types"
import type { RootState } from "@/lib/store"
import { cn } from "@/lib/utils"

const DEFAULT_SORT_BY: InvestmentPositionsSortBy = "marketValue"
const DEFAULT_SORT_DIRECTION: "ASC" | "DESC" = "DESC"
const DEFAULT_GAIN_LOSS_FILTER: GainLossFilter = "ALL"
const SEARCH_MAX_LENGTH = 16
const SKELETON_ROWS = 6

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

  if (status === 404) {
    return payload?.message ?? "Position not found."
  }

  if (status === 500) {
    return payload?.message ?? "Could not load positions. Please try again."
  }

  return payload?.message ?? "Could not load positions. Please try again."
}

function getPLColor(value: number): string {
  if (value > 0) {
    return "text-emerald-600"
  }
  if (value < 0) {
    return "text-rose-600"
  }
  return "text-muted-foreground"
}

function formatSignedCurrency(value: number): string {
  const sign = value >= 0 ? "+" : "−"
  return `${sign}${currencyFormatter.format(Math.abs(value))}`
}

function formatSignedPercent(value: number): string {
  const sign = value >= 0 ? "+" : "−"
  return `${sign}${Math.abs(value).toFixed(2)}%`
}

const sortOptions: Array<{ value: InvestmentPositionsSortBy; label: string }> = [
  { value: "marketValue", label: "Market Value" },
  { value: "unrealizedPnl", label: "Total Gain/Loss" },
  { value: "unrealizedPnlPercent", label: "Total G/L %" },
  { value: "dayChange", label: "Day Change" },
  { value: "dayChangePercent", label: "Day Change %" },
  { value: "ticker", label: "Ticker" },
  { value: "quantity", label: "Quantity" },
  { value: "averageBuyPrice", label: "Average Buy Price" },
]

const alphaSortFields = new Set<InvestmentPositionsSortBy>(["ticker", "companyName"])

export function InvestmentPositionsTable() {
  const router = useRouter()
  const token = useSelector(
    (state: RootState) => state.auth.content?.token ?? ""
  )
  const abortControllerRef = useRef<AbortController | null>(null)

  const [sortBy, setSortBy] = useState<InvestmentPositionsSortBy>(DEFAULT_SORT_BY)
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">(
    DEFAULT_SORT_DIRECTION
  )
  const [gainLossFilter, setGainLossFilter] = useState<GainLossFilter>(
    DEFAULT_GAIN_LOSS_FILTER
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [rows, setRows] = useState<PositionTableRow[]>([])
  const [priceDataPartial, setPriceDataPartial] = useState(false)

  const hasActiveFilters = Boolean(debouncedSearch || gainLossFilter !== "ALL")
  const showReset = useMemo(
    () =>
      sortBy !== DEFAULT_SORT_BY ||
      sortDirection !== DEFAULT_SORT_DIRECTION ||
      gainLossFilter !== DEFAULT_GAIN_LOSS_FILTER ||
      Boolean(debouncedSearch),
    [debouncedSearch, gainLossFilter, sortBy, sortDirection]
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
    }, 300)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [searchTerm])

  const fetchPositions = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await getInvestmentPositions(
        token,
        {
          sortBy,
          sortDirection,
          gainLossFilter,
          ...(debouncedSearch ? { q: debouncedSearch } : {}),
        },
        controller.signal
      )

      if (controller.signal.aborted) {
        return
      }

      if (response.status === 200) {
        const payload = extractInvestmentPositionsContent(response.data)
        const nextRows =
          payload?.positions.map((position) => ({
            ...position,
            positionId: String(position.id),
            totalGainLoss: position.unrealizedPnl,
            totalGainLossPercent: position.unrealizedPnlPercent,
          })) ?? []

        setRows(nextRows)
        setPriceDataPartial(payload?.priceDataPartial ?? false)
        return
      }

      const body = response.data as InvestmentApiErrorResponse
      setRows([])
      setPriceDataPartial(false)
      setErrorMessage(getErrorMessage(response.status, body))
    } catch {
      if (controller.signal.aborted) {
        return
      }

      setRows([])
      setPriceDataPartial(false)
      setErrorMessage("Could not load positions. Please try again.")
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false)
      }
    }
  }, [debouncedSearch, gainLossFilter, sortBy, sortDirection, token])

  useEffect(() => {
    void fetchPositions()
  }, [fetchPositions])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const columns = useMemo<ColumnDef<PositionTableRow>[]>(
    () => [
      {
        accessorKey: "ticker",
        header: "Symbol",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarImage
                src={row.original.logoUrl ?? undefined}
                alt={`${row.original.ticker} logo`}
              />
              <AvatarFallback>{row.original.ticker.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium">{row.original.ticker}</p>
              <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                {row.original.companyName}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => <span className="tabular-nums">{row.original.quantity}</span>,
      },
      {
        accessorKey: "averageBuyPrice",
        header: "Avg Buy Price",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {currencyFormatter.format(row.original.averageBuyPrice)}
          </span>
        ),
      },
      {
        accessorKey: "currentPrice",
        header: "Last Price",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {currencyFormatter.format(row.original.currentPrice)}
          </span>
        ),
      },
      {
        accessorKey: "dayChange",
        header: "Changes",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "font-normal",
              row.original.dayChange > 0
                ? "border-lime-500/30 bg-lime-500/10 text-lime-700 hover:bg-lime-500/10"
                : row.original.dayChange < 0
                  ? "border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/10"
                  : "border-muted-foreground/30 bg-muted text-muted-foreground hover:bg-muted"
            )}
          >
            {formatSignedCurrency(row.original.dayChange)} (
            {formatSignedPercent(row.original.dayChangePercent)})
          </Badge>
        ),
      },
      {
        accessorKey: "marketValue",
        header: "Market Value",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {currencyFormatter.format(row.original.marketValue)}
          </span>
        ),
      },
      {
        accessorKey: "totalGainLoss",
        header: "Total G/L",
        cell: ({ row }) => (
          <span
            className={cn("font-medium tabular-nums", getPLColor(row.original.totalGainLoss))}
          >
            {formatSignedCurrency(row.original.totalGainLoss)}
          </span>
        ),
      },
      {
        accessorKey: "totalGainLossPercent",
        header: "G/L %",
        cell: ({ row }) => (
          <span
            className={cn(
              "font-medium tabular-nums",
              getPLColor(row.original.totalGainLossPercent)
            )}
          >
            {formatSignedPercent(row.original.totalGainLossPercent)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Details",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(`/investment-account/portfolio/${row.original.positionId}`)
            }
          >
            Get Details
            <ArrowRight data-icon="inline-end" />
          </Button>
        ),
      },
    ],
    [router]
  )

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const directionLabels = alphaSortFields.has(sortBy)
    ? { ASC: "A→Z", DESC: "Z→A" }
    : { ASC: "Lowest first", DESC: "Highest first" }

  return (
    <TooltipProvider>
      <Card className="flex h-full min-w-0 w-full max-w-full flex-col overflow-hidden">
        <CardHeader>
          <CardTitle>Portfolio Positions</CardTitle>
          <CardDescription>
            Your current open positions and unrealized gains.
          </CardDescription>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-3">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={gainLossFilter}
              onValueChange={(nextValue) => {
                const value = (nextValue as GainLossFilter) || "ALL"
                setGainLossFilter(value)
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
              onChange={(event) =>
                setSearchTerm(event.target.value.slice(0, SEARCH_MAX_LENGTH))
              }
              className="h-8 w-[220px]"
              placeholder="Search ticker or company..."
              maxLength={SEARCH_MAX_LENGTH}
            />

            <div className="flex items-center gap-2">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as InvestmentPositionsSortBy)}
              >
                <SelectTrigger size="sm" className="w-[170px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                value={sortDirection}
                onValueChange={(value) => setSortDirection(value as "ASC" | "DESC")}
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
                  setGainLossFilter(DEFAULT_GAIN_LOSS_FILTER)
                  setSearchTerm("")
                  setDebouncedSearch("")
                  setSortBy(DEFAULT_SORT_BY)
                  setSortDirection(DEFAULT_SORT_DIRECTION)
                }}
              >
                <X data-icon="inline-start" />
                Reset
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="flex min-h-[40vh] min-w-0 max-w-full flex-1 flex-col overflow-x-auto">
          {errorMessage ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <Button variant="outline" size="sm" onClick={() => void fetchPositions()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 flex-col">
              {priceDataPartial ? (
                <Alert className="mb-4">
                  <AlertDescription>
                    Live prices unavailable for some tickers — values below use cost
                    basis.
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="min-w-0 max-w-full">
                <Table className="min-w-[1060px] table-fixed">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header, index) => {
                          const className = cn(
                            index === 0 && "w-[260px]",
                            index === 1 && "w-[100px]",
                            index === 2 && "w-[130px]",
                            index === 3 && "w-[130px]",
                            index === 4 && "w-[200px]",
                            index === 5 && "w-[140px]",
                            index === 6 && "w-[140px]",
                            index === 7 && "w-[110px]",
                            index === 8 && "w-[130px]"
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
                      Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
                        <TableRow key={`skeleton-${rowIndex}`}>
                          {Array.from({ length: columns.length }, (_, cellIndex) => (
                            <TableCell key={`${rowIndex}-${cellIndex}`}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
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
                              <EmptyTitle>No open positions yet.</EmptyTitle>
                              <EmptyDescription>
                                {hasActiveFilters
                                  ? "Try adjusting your filters."
                                  : "Visit the Trade page to start investing."}
                              </EmptyDescription>
                            </EmptyHeader>
                            {!hasActiveFilters ? (
                              <EmptyContent>
                                <Button
                                  onClick={() =>
                                    router.push("/investment-account/trade")
                                  }
                                >
                                  Go to Trade
                                </Button>
                              </EmptyContent>
                            ) : null}
                          </Empty>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
