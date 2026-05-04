"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { AlertCircle } from "lucide-react";
import type { DateRange } from "react-day-picker";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { ChartDateRangePicker } from "@/components/components/checking-account/chart-date-range-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getTimeSeriesData } from "@/lib/checking-account/api";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  TimeSeriesContent,
  TimeSeriesDataPoint,
  TimeSeriesPeriod,
} from "@/lib/checking-account/types";

type AccountTimeSeriesChartProps = {
  token: string;
};

type NormalizedTimeSeriesDataPoint = TimeSeriesDataPoint & {
  totalExpenseNegative: number;
};

const chartConfig = {
  totalIncome: {
    label: "Income",
    color: "var(--chart-1)",
  },
  totalExpenseNegative: {
    label: "Expense",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const fullCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const PERIOD_OPTIONS: Array<{ value: TimeSeriesPeriod; label: string }> = [
  { value: "DAY", label: "Day" },
  { value: "WEEK", label: "Week" },
  { value: "MONTH", label: "Month" },
];

function getDefaultRange(period: TimeSeriesPeriod): { from: Date; to: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (period) {
    case "WEEK":
      return { from: subDays(today, 83), to: today };
    case "MONTH":
      return { from: startOfMonth(subMonths(today, 11)), to: today };
    case "DAY":
    default:
      return { from: subDays(today, 29), to: today };
  }
}

function getXAxisLabel(intervalLabel: string, period: TimeSeriesPeriod): string {
  if (period === "DAY") {
    return format(parseISO(intervalLabel), "MMM d");
  }

  if (period === "MONTH") {
    return format(parseISO(`${intervalLabel}-01`), "MMM yy");
  }

  return intervalLabel;
}

function getTooltipIntervalLabel(intervalLabel: string, period: TimeSeriesPeriod): string {
  if (period === "DAY") {
    return format(parseISO(intervalLabel), "MMM d, y");
  }

  if (period === "MONTH") {
    return format(parseISO(`${intervalLabel}-01`), "MMM y");
  }

  return intervalLabel;
}

function getErrorMessage(status: number, payload: ApiErrorResponse | undefined): string {
  if (status === 400) {
    return payload?.message ?? "Invalid request. Please adjust your filters.";
  }

  if (status === 401) {
    return "Your session has expired. Please log in again.";
  }

  return "Could not load chart data. Please try again.";
}

function normalizeDataPoints(content?: TimeSeriesContent): NormalizedTimeSeriesDataPoint[] {
  return (content?.dataPoints ?? []).map((point) => ({
    ...point,
    intervalLabel: point.intervalLabel,
    totalIncome: Number(point.totalIncome ?? 0),
    totalExpense: Number(point.totalExpense ?? 0),
    totalExpenseNegative: -Math.abs(Number(point.totalExpense ?? 0)),
  }));
}

export function AccountTimeSeriesChart({ token }: AccountTimeSeriesChartProps) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [period, setPeriod] = useState<TimeSeriesPeriod>("DAY");
  const [dateRange, setDateRange] = useState<DateRange>(() => getDefaultRange("DAY"));
  const [hasCustomDateRange, setHasCustomDateRange] = useState(false);
  const [dataPoints, setDataPoints] = useState<NormalizedTimeSeriesDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fallbackRange = useMemo(() => getDefaultRange(period), [period]);
  const selectedRange = dateRange?.from && dateRange?.to
    ? { from: dateRange.from, to: dateRange.to }
    : fallbackRange;

  const queryStartDate = format(selectedRange.from, "yyyy-MM-dd");
  const queryEndDate = format(selectedRange.to, "yyyy-MM-dd");
  const customRangeFrom = dateRange?.from;
  const customRangeTo = dateRange?.to;

  const isLongDayRange =
    period === "DAY" && customRangeFrom && customRangeTo
      ? differenceInCalendarDays(customRangeTo, customRangeFrom) + 1 > 180
      : false;

  const chartMinWidth = useMemo(() => {
    const pointCount = Math.max(dataPoints.length, 1);
    const pxPerPoint = period === "DAY" ? 32 : period === "WEEK" ? 56 : 72;
    return `max(100%, ${pointCount * pxPerPoint}px)`;
  }, [dataPoints.length, period]);

  const hasNoDataPoints = dataPoints.length === 0;
  const hasOnlyZeroValues = useMemo(
    () =>
      dataPoints.length > 0 &&
      dataPoints.every((point) => point.totalIncome === 0 && point.totalExpense === 0),
    [dataPoints]
  );

  const showEmptyOverlay = hasNoDataPoints || hasOnlyZeroValues;

  const yDomain: [number, number] | [(dataMin: number) => number, (dataMax: number) => number] =
    hasNoDataPoints || hasOnlyZeroValues ? [0, 100] : [
      (dataMin: number) =>
        dataMin === 0 ? 0 : Math.floor(dataMin - Math.abs(dataMin) * 0.1),
      (dataMax: number) =>
        dataMax === 0 ? 0 : Math.ceil(dataMax + Math.abs(dataMax) * 0.1),
    ];

  const fetchData = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await getTimeSeriesData(
        token,
        {
          period,
          startDate: queryStartDate,
          endDate: queryEndDate,
        },
        controller.signal
      );

      if (controller.signal.aborted) {
        return;
      }

      if (response.status === 200) {
        const body = response.data as ApiSuccessResponse<TimeSeriesContent>;
        setDataPoints(normalizeDataPoints(body.content));
        return;
      }

      const errorBody = response.data as ApiErrorResponse;
      setError(getErrorMessage(response.status, errorBody));
      setDataPoints([]);
    } catch {
      if (controller.signal.aborted) {
        return;
      }

      setError("Could not load chart data. Please try again.");
      setDataPoints([]);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [period, queryEndDate, queryStartDate, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!hasCustomDateRange) {
      setDateRange(fallbackRange);
    }
  }, [fallbackRange, hasCustomDateRange]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleDateRangeChange = (nextRange: DateRange | undefined) => {
    if (!nextRange) {
      // DayPicker may emit undefined as part of "start a new range" interactions.
      // Keep custom mode active so fallback doesn't immediately overwrite selection.
      setHasCustomDateRange(true);
      setDateRange(undefined);
      return;
    }

    setDateRange(nextRange);
    // Keep custom mode enabled during partial selection so the picker doesn't
    // get reset before users can choose an updated start/end date.
    setHasCustomDateRange(Boolean(nextRange.from || nextRange.to));
  };

  const handleDateRangeClear = () => {
    setHasCustomDateRange(false);
    setDateRange(fallbackRange);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="space-y-4">
          <div>
            <CardTitle>Income &amp; Expense Trend</CardTitle>
            <CardDescription>Track your cash flow over time.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 max-md:flex-col max-md:items-stretch">
            <Select value={period} onValueChange={(value) => setPeriod(value as TimeSeriesPeriod)}>
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
                <p className="text-sm text-muted-foreground">No transactions in this range.</p>
              </div>
            ) : null}
            <div className="overflow-x-auto">
              {/* TODO: sticky Y-axis */}
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[280px] w-full"
                style={{ minWidth: chartMinWidth }}
              >
                <AreaChart
                  accessibilityLayer
                  data={dataPoints}
                  margin={{ top: 12, right: 16, left: 8, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-totalIncome)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-totalIncome)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-totalExpenseNegative)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-totalExpenseNegative)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="intervalLabel"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                    tickFormatter={(label) => getXAxisLabel(String(label), period)}
                  />
                  <YAxis
                    width={80}
                    axisLine={false}
                    tickLine={false}
                    domain={yDomain}
                    tickFormatter={(value) => compactCurrencyFormatter.format(Number(value))}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) => getTooltipIntervalLabel(String(label), period)}
                        formatter={(value, name) => (
                          <div className="flex w-full items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              {name === "totalIncome" ? "Income" : "Expense"}
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {fullCurrencyFormatter.format(
                                name === "totalExpenseNegative"
                                  ? Math.abs(Number(value))
                                  : Number(value)
                              )}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
                  <Area
                    type="monotone"
                    dataKey="totalExpenseNegative"
                    fill="url(#expenseGradient)"
                    fillOpacity={0.4}
                    stroke="var(--color-totalExpenseNegative)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalIncome"
                    fill="url(#incomeGradient)"
                    fillOpacity={0.4}
                    stroke="var(--color-totalIncome)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
