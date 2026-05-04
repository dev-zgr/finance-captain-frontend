"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  format,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns"
import { AlertCircle, ChartPie, Landmark, TrendingUp } from "lucide-react"
import type { DateRange } from "react-day-picker"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { ChartDateRangePicker } from "@/components/components/checking-account/chart-date-range-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getInvestmentCharts } from "@/lib/investment-account/api"
import type {
  DistributionSlice,
  InvestmentApiErrorResponse,
  InvestmentApiSuccessResponse,
  InvestmentChartsContent,
  InvestmentChartsUiPeriod,
  PortfolioValuePoint,
  ProfitLossPoint,
} from "@/lib/investment-account/types"

const PERIOD_OPTIONS: Array<{ value: InvestmentChartsUiPeriod; label: string }> = [
  { value: "DAY", label: "Day" },
  { value: "WEEK", label: "Week" },
  { value: "MONTH", label: "Month" },
]

type InvestmentChartView = "PORTFOLIO_VALUE" | "PROFIT_LOSS" | "DISTRIBUTION"

const CHART_VIEW_OPTIONS: Array<{ value: InvestmentChartView; label: string }> = [
  { value: "PORTFOLIO_VALUE", label: "Portfolio Value" },
  { value: "PROFIT_LOSS", label: "Profit & Loss" },
  { value: "DISTRIBUTION", label: "Asset Distribution" },
]

const portfolioValueConfig = {
  portfolioValue: {
    label: "Portfolio Value",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const pnlConfig = {
  realizedPnl: {
    label: "Realized",
    color: "#16a34a",
  },
} satisfies ChartConfig

const distributionConfig = {
  percent: {
    label: "Allocation",
    color: "var(--chart-3)",
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

function getDefaultRange(period: InvestmentChartsUiPeriod): { from: Date; to: Date } {
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

function getXAxisLabel(intervalLabel: string, period: InvestmentChartsUiPeriod): string {
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
  period: InvestmentChartsUiPeriod
): string {
  if (period === "DAY") {
    return format(parseISO(intervalLabel), "MMM d, y")
  }

  if (period === "MONTH") {
    return format(parseISO(`${intervalLabel}-01`), "MMM y")
  }

  return intervalLabel
}

function parseAmount(value: number | string | null | undefined): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getErrorMessage(
  status: number,
  payload: InvestmentApiErrorResponse | undefined
): string {
  if (status === 400) {
    return payload?.message ?? "Invalid request. Please adjust your filters."
  }

  if (status === 401) {
    return "Your session has expired. Please log in again."
  }

  return "Could not load chart data. Please try again."
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener("change", handleChange)
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  return prefersReducedMotion
}

function normalizeChartsContent(content?: InvestmentChartsContent) {
  return {
    portfolioValueSeries: (content?.portfolioValueSeries ?? []).map((point: PortfolioValuePoint) => ({
      ...point,
      portfolioValue: parseAmount(point.portfolioValue),
    })),
    profitLossSeries: (content?.profitLossSeries ?? []).map((point: ProfitLossPoint) => ({
      ...point,
      realizedPnl: parseAmount(point.realizedPnl),
      unrealizedPnlChange: parseAmount(point.unrealizedPnlChange),
      totalPnl: parseAmount(point.totalPnl),
    })),
    distribution: (content?.distribution ?? []).map((slice: DistributionSlice) => ({
      ...slice,
      marketValue: parseAmount(slice.marketValue),
      percent: parseAmount(slice.percent),
    })),
  }
}

type InvestmentChartsCardProps = {
  token: string
}

export function InvestmentChartsCard({ token }: InvestmentChartsCardProps) {
  const abortControllerRef = useRef<AbortController | null>(null)

  const [period, setPeriod] = useState<InvestmentChartsUiPeriod>("DAY")
  const [selectedChart, setSelectedChart] =
    useState<InvestmentChartView>("PORTFOLIO_VALUE")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
    getDefaultRange("DAY")
  )
  const [hasCustomDateRange, setHasCustomDateRange] = useState(false)

  const [portfolioValueSeries, setPortfolioValueSeries] = useState<
    Array<{ intervalLabel: string; portfolioValue: number }>
  >([])
  const [profitLossSeries, setProfitLossSeries] = useState<
    Array<{
      intervalLabel: string
      realizedPnl: number
      totalPnl: number
    }>
  >([])
  const [distribution, setDistribution] = useState<
    Array<{
      ticker: string
      label: string
      marketValue: number
      percent: number
      color: string
    }>
  >([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const prefersReducedMotion = usePrefersReducedMotion()

  const fallbackRange = useMemo(() => getDefaultRange(period), [period])
  const selectedRange =
    dateRange?.from && dateRange?.to
      ? { from: dateRange.from, to: dateRange.to }
      : fallbackRange

  const queryStartDate = format(selectedRange.from, "yyyy-MM-dd")
  const queryEndDate = format(selectedRange.to, "yyyy-MM-dd")

  const fetchData = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const response = await getInvestmentCharts(
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
        const body = response.data as InvestmentApiSuccessResponse<InvestmentChartsContent>
        const normalized = normalizeChartsContent(body.content ?? body.data)

        setPortfolioValueSeries(normalized.portfolioValueSeries)
        setProfitLossSeries(normalized.profitLossSeries)
        setDistribution(normalized.distribution)
        return
      }

      const errorBody = response.data as InvestmentApiErrorResponse
      setError(getErrorMessage(response.status, errorBody))
      setPortfolioValueSeries([])
      setProfitLossSeries([])
      setDistribution([])
    } catch {
      if (controller.signal.aborted) {
        return
      }

      setError("Could not load chart data. Please try again.")
      setPortfolioValueSeries([])
      setProfitLossSeries([])
      setDistribution([])
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

  const isPortfolioValueEmpty = portfolioValueSeries.length === 0
  const isProfitLossEmpty = profitLossSeries.length === 0
  const isDistributionEmpty = distribution.length === 0

  return (
    <Card className="col-span-8 flex h-full flex-col max-lg:col-span-12">
      <CardHeader>
        <div className="space-y-4">
          <div>
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              Track your portfolio value, gains and losses, and asset mix.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 max-md:flex-col max-md:items-stretch">
            <Select
              value={selectedChart}
              onValueChange={(value) => setSelectedChart(value as InvestmentChartView)}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Chart" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CHART_VIEW_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={period}
              onValueChange={(value) => setPeriod(value as InvestmentChartsUiPeriod)}
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

            <ChartDateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              onClear={handleDateRangeClear}
              clearable={hasCustomDateRange}
              className="max-md:w-full"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {loading ? (
          <Skeleton className="h-[860px] w-full" />
        ) : error ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button variant="outline" size="sm" type="button" onClick={fetchData}>
              Retry
            </Button>
          </div>
        ) : (
          <div>
            {selectedChart === "PORTFOLIO_VALUE" ? (
              <section className="flex h-full flex-col space-y-2">
                <h3 className="text-sm font-medium">Portfolio Value</h3>
                {isPortfolioValueEmpty ? (
                  <Empty className="min-h-[260px] flex-1 rounded-md border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <TrendingUp className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>No data to display yet.</EmptyTitle>
                      <EmptyDescription>
                        No data to display yet.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <ChartContainer
                    config={portfolioValueConfig}
                    className="h-full min-h-[260px] w-full flex-1"
                  >
                    <AreaChart
                      accessibilityLayer
                      data={portfolioValueSeries}
                      margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                    >
                      <defs>
                        <linearGradient id="pvGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="intervalLabel"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={24}
                        tickFormatter={(label) => getXAxisLabel(String(label), period)}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => compactCurrencyFormatter.format(Number(value))}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(label) =>
                              getTooltipIntervalLabel(String(label), period)
                            }
                            formatter={(value) => (
                              <span className="font-mono font-medium tabular-nums">
                                {fullCurrencyFormatter.format(Number(value))}
                              </span>
                            )}
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="portfolioValue"
                        stroke="var(--chart-1)"
                        fill="url(#pvGradient)"
                        isAnimationActive={!prefersReducedMotion}
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
              </section>
            ) : null}

            {selectedChart === "PROFIT_LOSS" ? (
              <section className="flex h-full flex-col space-y-2">
                <h3 className="text-sm font-medium">Profit &amp; Loss</h3>
                {isProfitLossEmpty ? (
                  <Empty className="min-h-[260px] flex-1 rounded-md border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Landmark className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>No data to display yet.</EmptyTitle>
                      <EmptyDescription>
                        No data to display yet.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="h-full min-h-[260px] w-full flex-1">
                    <ChartContainer
                      config={pnlConfig}
                      className="h-full min-h-[260px] w-full flex-1"
                    >
                      <BarChart accessibilityLayer data={profitLossSeries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="intervalLabel"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={24}
                          tickFormatter={(label) => getXAxisLabel(String(label), period)}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => compactCurrencyFormatter.format(Number(value))}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              labelFormatter={(label) =>
                                getTooltipIntervalLabel(String(label), period)
                              }
                              formatter={(value, name) => (
                                <div className="flex w-full items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    {name === "realizedPnl" ? "Realized" : String(name)}
                                  </span>
                                  <span className="font-mono font-medium tabular-nums">
                                    {fullCurrencyFormatter.format(Number(value))}
                                  </span>
                                </div>
                              )}
                            />
                          }
                        />
                        <Bar
                          dataKey="realizedPnl"
                          fill="var(--color-realizedPnl)"
                          name="Realized"
                          isAnimationActive={!prefersReducedMotion}
                        >
                          {profitLossSeries.map((point) => (
                            <Cell
                              key={`realized-${point.intervalLabel}`}
                              fill={point.realizedPnl < 0 ? "#dc2626" : "#16a34a"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-[2px]"
                          style={{ backgroundColor: "#16a34a" }}
                        />
                        <span className="text-muted-foreground">Realized Profit</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-[2px]"
                          style={{ backgroundColor: "#dc2626" }}
                        />
                        <span className="text-muted-foreground">Realized Loss</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            ) : null}

            {selectedChart === "DISTRIBUTION" ? (
              <section className="space-y-2">
                <h3 className="text-sm font-medium">Asset Distribution</h3>
                {isDistributionEmpty ? (
                  <Empty className="min-h-[280px] rounded-md border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ChartPie className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>No data to display yet.</EmptyTitle>
                      <EmptyDescription>
                        No data to display yet.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div>
                    <ChartContainer config={distributionConfig} className="h-[280px] w-full">
                      <PieChart accessibilityLayer>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(_, __, item) => {
                                const slice = item?.payload as
                                  | {
                                      label?: string
                                      percent?: number
                                      marketValue?: number
                                    }
                                  | undefined
                                const percent = Number(slice?.percent ?? 0)
                                const marketValue = Number(slice?.marketValue ?? 0)

                                return (
                                  <div className="grid gap-1">
                                    <div className="text-muted-foreground">
                                      {String(item?.name ?? slice?.label ?? "")}
                                    </div>
                                    <div className="font-mono font-medium tabular-nums">
                                      {percent.toFixed(2)}% • {fullCurrencyFormatter.format(marketValue)}
                                    </div>
                                  </div>
                                )
                              }}
                            />
                          }
                        />
                        <Pie
                          data={distribution}
                          dataKey="percent"
                          nameKey="label"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          isAnimationActive={!prefersReducedMotion}
                        >
                          {distribution.map((slice) => (
                            <Cell key={slice.ticker} fill={slice.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      {distribution.map((slice) => (
                        <div
                          key={`legend-${slice.ticker}`}
                          className="flex items-center gap-2"
                        >
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-[2px]"
                            style={{ backgroundColor: slice.color }}
                          />
                          <span className="truncate text-muted-foreground">
                            {slice.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
