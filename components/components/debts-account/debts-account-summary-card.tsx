"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { AlertCircle, Calendar, TrendingDown, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { getDebtsAccountSummary } from "@/lib/debts-account/api";
import type { DebtsAccountSummary } from "@/lib/debts-account/types";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const formatLiabilities = (value: number) => {
  if (value < 0) {
    return `-${formatCurrency(Math.abs(value))}`;
  }

  return formatCurrency(value);
};

function getErrorMessage(): string {
  return "Could not load account summary. Please try again.";
}

type Props = {
  token: string;
  refreshKey?: number;
};

export function DebtsAccountSummaryCard({ token, refreshKey }: Props) {
  const [summary, setSummary] = useState<DebtsAccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDebtsAccountSummary(token);
      if (res.status === 200) {
        const body = res.data as { data?: DebtsAccountSummary; content?: DebtsAccountSummary };
        setSummary(body.data ?? body.content ?? null);
      } else {
        setError(getErrorMessage());
      }
    } catch {
      setError("Could not load account summary. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, refreshKey]);

  const currentLiabilities = summary?.currentDebtsAccountBalance ?? 0;
  const debtsThisMonth = summary?.totalDebtsTakenThisMonth ?? 0;
  const paymentsThisMonth = summary?.totalPaymentsMadeThisMonth ?? 0;
  const accountOpeningDate = summary?.accountOpeningDate ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liabilities</CardTitle>
        <CardDescription>Your debts account at a glance.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center gap-3">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchSummary}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Liabilities</p>
              <p
                className={cn(
                  "text-2xl font-semibold tracking-tight",
                  currentLiabilities < 0 && "text-red-600 dark:text-red-500",
                )}
              >
                {formatLiabilities(currentLiabilities)}
              </p>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="size-4 text-red-600 dark:text-red-500" />
                  Debts this month
                </span>
                <span className="text-sm font-medium tabular-nums">{formatCurrency(debtsThisMonth)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingDown className="size-4 text-green-600 dark:text-green-500" />
                  Payments this month
                </span>
                <span className="text-sm font-medium tabular-nums">{formatCurrency(paymentsThisMonth)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4 text-muted-foreground" />
                  Account opened
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {accountOpeningDate ? format(parseISO(accountOpeningDate), "MMM d, yyyy") : "—"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
