"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns"
import { AlertCircle } from "lucide-react"
import type { DateRange } from "react-day-picker"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { ChartDateRangePicker } from "@/components/components/checking-account/chart-date-range-picker"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getDebtsTimeSeriesData } from "@/lib/debts-account/api"
import type {
  DebtsApiErrorResponse,
  DebtsApiSuccessResponse,
  DebtsTimeSeriesContent,
  DebtsTimeSeriesDataPoint,
  DebtsTimeSeriesPeriod,
} from "@/lib/debts-account/types"

type DebtsTimeSeriesChartProps = {
  token: string
}

type NormalizedDebtsTimeSeriesDataPoint = DebtsTimeSeriesDataPoint & {
  totalDebtsNegative: number
  totalPaymentsNegative: number
}

const chartConfig = {
  totalDebtsNegative: {
    label: "Debts",
    color: "var(--chart-2)",
  },
  totalPaymentsNegative: {
    label: "Payments",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
})

const fullCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const PERIOD_OPTIONS: Array<{ value: DebtsTimeSeriesPeriod; label: string }> = [
  { value: "DAY", label: "Day" },
  { value: "WEEK", label: "Week" },
  { value: "MONTH", label: "Month" },
]

function getDefaultRange(period: DebtsTimeSeriesPeriod): {
  from: Date
  to: Date
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  switch (period) {
    case "WEEK":
      return { from: subDays(today, 83), to: today }
    case "MONTH":
      return { from: startOfMonth(subMonths(today, 11)), to: today }
    case "DAY":
    default:
      return { from: subDays(today, 29), to: today }
  }
}

function getXAxisLabel(
  intervalLabel: string,
  period: DebtsTimeSeriesPeriod
): string {
  if (period === "DAY") {
    return format(parseISO(intervalLabel), "MMM d")
  }

  if (period === "MONTH") {
    return format(parseISO(`${intervalLabel}-01`), "MMM yy")
  }

  return intervalLabel
}

function getTooltipIntervalLabel(
  intervalLabel: string,
  period: DebtsTimeSeriesPeriod
): string {
  if (period === "DAY") {
    return format(parseISO(intervalLabel), "MMM d, y")
  }

  if (period === "MONTH") {
    return format(parseISO(`${intervalLabel}-01`), "MMM y")
  }

  return intervalLabel
}

function getErrorMessage(
  status: number,
  payload: DebtsApiErrorResponse | undefined
): string {
  if (status === 400) {
    return payload?.message ?? "Invalid request. Please adjust your filters."
  }

  if (status === 401) {
    return "Your session has expired. Please log in again."
  }

  return "Could not load chart data. Please try again."
}

function normalizeDataPoints(
  content?: DebtsTimeSeriesContent
): NormalizedDebtsTimeSeriesDataPoint[] {
  return (content?.dataPoints ?? []).map((point) => ({
    ...point,
    intervalLabel: point.intervalLabel,
    totalDebts: Number(point.totalDebts ?? 0),
    totalPayments: Number(point.totalPayments ?? 0),
    totalDebtsNegative: -Math.abs(Number(point.totalDebts ?? 0)),
    totalPaymentsNegative: -Math.abs(Number(point.totalPayments ?? 0)),
  }))
}

export function DebtsTimeSeriesChart({ token }: DebtsTimeSeriesChartProps) {
  const abortControllerRef = useRef<AbortController | null>(null)
  const [period, setPeriod] = useState<DebtsTimeSeriesPeriod>("DAY")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
    getDefaultRange("DAY")
  )
  const [hasCustomDateRange, setHasCustomDateRange] = useState(false)
  const [dataPoints, setDataPoints] = useState<
    NormalizedDebtsTimeSeriesDataPoint[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fallbackRange = useMemo(() => getDefaultRange(period), [period])
  const selectedRange =
    dateRange?.from && dateRange?.to
      ? { from: dateRange.from, to: dateRange.to }
      : fallbackRange

  const queryStartDate = format(selectedRange.from, "yyyy-MM-dd")
  const queryEndDate = format(selectedRange.to, "yyyy-MM-dd")
  const customRangeFrom = dateRange?.from
  const customRangeTo = dateRange?.to

  const isLongDayRange =
    period === "DAY" && customRangeFrom && customRangeTo
      ? differenceInCalendarDays(customRangeTo, customRangeFrom) + 1 > 180
      : false

  const chartMinWidth = useMemo(() => {
    const pointCount = Math.max(dataPoints.length, 1)
    return `${Math.max(700, pointCount * 40)}px`
  }, [dataPoints.length])

  const hasNoDataPoints = dataPoints.length === 0
  const hasOnlyZeroValues = useMemo(
    () =>
      dataPoints.length > 0 &&
      dataPoints.every(
        (point) => point.totalDebts === 0 && point.totalPayments === 0
      ),
    [dataPoints]
  )

  const showEmptyOverlay = hasNoDataPoints || hasOnlyZeroValues

  const yDomain: [number, number] = useMemo(() => {
    if (hasNoDataPoints || hasOnlyZeroValues) {
      return [-100, 100]
    }

    const maxValue = Math.max(
      ...dataPoints.map((point) => Math.abs(point.totalDebts)),
      ...dataPoints.map((point) => Math.abs(point.totalPayments)),
      0
    )

    return [Math.floor(-1.1 * maxValue), 0]
  }, [dataPoints, hasNoDataPoints, hasOnlyZeroValues])

  const fetchData = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const response = await getDebtsTimeSeriesData(
        token,
        {
          period,
          startDate: queryStartDate,
          endDate: queryEndDate,
        },
        controller.signal
      )

      if (controller.signal.aborted) {
        return
      }

      if (response.status === 200) {
        const body =
          response.data as DebtsApiSuccessResponse<DebtsTimeSeriesContent>
        setDataPoints(normalizeDataPoints(body.content ?? body.data))
        return
      }

      const errorBody = response.data as DebtsApiErrorResponse
      setError(getErrorMessage(response.status, errorBody))
      setDataPoints([])
    } catch {
      if (controller.signal.aborted) {
        return
      }

      setError("Could not load chart data. Please try again.")
      setDataPoints([])
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false)
      }
    }
  }, [period, queryEndDate, queryStartDate, token])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const handleDateRangeChange = (nextRange: DateRange | undefined) => {
    if (!nextRange) {
      setHasCustomDateRange(true)
      setDateRange(undefined)
      return
    }

    setDateRange(nextRange)
    setHasCustomDateRange(Boolean(nextRange.from || nextRange.to))
  }

  const handleDateRangeClear = () => {
    setHasCustomDateRange(false)
    setDateRange(fallbackRange)
  }

  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <div className="space-y-4">
          <div>
            <CardTitle>Debts &amp; Payments Trend</CardTitle>
            <CardDescription>
              Track how your debts grow and shrink over time.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 max-md:flex-col max-md:items-stretch">
            <Select
              value={period}
              onValueChange={(value) =>
                setPeriod(value as DebtsTimeSeriesPeriod)
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <div className="flex flex-col items-start gap-1">
              <ChartDateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                onClear={handleDateRangeClear}
                clearable={hasCustomDateRange}
              />
              {isLongDayRange ? (
                <p className="text-xs text-muted-foreground">
                  Tip: switch to Week or Month for ranges longer than ~6 months.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        {loading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : error ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="relative">
            {showEmptyOverlay ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No debts activity in this range.
                </p>
              </div>
            ) : null}
            <div className="w-full overflow-x-auto">
              <div style={{ minWidth: chartMinWidth }}>
                <ChartContainer
                  config={chartConfig}
                  className="aspect-auto h-[280px] w-full"
                >
                  <AreaChart
                    accessibilityLayer
                    data={dataPoints}
                    margin={{ top: 12, right: 16, left: 8, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient
                        id="debtsGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--color-totalDebtsNegative)"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--color-totalDebtsNegative)"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                      <linearGradient
                        id="paymentsGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--color-totalPaymentsNegative)"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--color-totalPaymentsNegative)"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <ReferenceLine
                      y={0}
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="intervalLabel"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={24}
                      tickFormatter={(label) =>
                        getXAxisLabel(String(label), period)
                      }
                    />
                    <YAxis
                      width={80}
                      axisLine={false}
                      tickLine={false}
                      domain={yDomain}
                      tickFormatter={(value) =>
                        compactCurrencyFormatter.format(Number(value))
                      }
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(label) =>
                            getTooltipIntervalLabel(String(label), period)
                          }
                          formatter={(value, name) => (
                            <div className="flex w-full items-center justify-between gap-3">
                              <span className="text-muted-foreground">
                                {name === "totalDebtsNegative"
                                  ? "Debts"
                                  : "Payments"}
                              </span>
                              <span className="font-mono font-medium tabular-nums">
                                {fullCurrencyFormatter.format(
                                  Math.abs(Number(value))
                                )}
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <ChartLegend
                      content={<ChartLegendContent />}
                      verticalAlign="bottom"
                    />
                    <Area
                      type="monotone"
                      dataKey="totalPaymentsNegative"
                      stackId={undefined}
                      fill="url(#paymentsGradient)"
                      fillOpacity={0.4}
                      stroke="var(--color-totalPaymentsNegative)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalDebtsNegative"
                      stackId={undefined}
                      fill="url(#debtsGradient)"
                      fillOpacity={0.4}
                      stroke="var(--color-totalDebtsNegative)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
