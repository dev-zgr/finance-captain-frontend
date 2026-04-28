"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { AlertCircle, Calendar, TrendingDown, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getAccountSummary } from "@/lib/checking-account/api";
import type { AccountSummary } from "@/lib/checking-account/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

function getErrorMessage(): string {
  return "Could not load account summary. Please try again.";
}

type Props = {
  token: string;
  refreshKey?: number;
};

export function AccountSummaryCard({ token, refreshKey }: Props) {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAccountSummary(token);
      if (res.status === 200) {
        const body = res.data as { data?: AccountSummary };
        setSummary(body.data ?? null);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Summary</CardTitle>
        <CardDescription>Your checking account at a glance.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="min-h-[180px] flex items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <div className="min-h-[180px] flex flex-col items-center justify-center gap-3">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchSummary}>
              Retry
            </Button>
          </div>
        ) : summary ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-semibold tracking-tight">{formatCurrency(summary.accountBalance)}</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="size-4 text-green-600 dark:text-green-500" />
                  Monthly Income
                </span>
                <span className="text-sm font-medium tabular-nums">{formatCurrency(summary.monthlyIncome)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingDown className="size-4 text-red-600 dark:text-red-500" />
                  Monthly Expense
                </span>
                <span className="text-sm font-medium tabular-nums">{formatCurrency(summary.monthlyExpenses)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4 text-muted-foreground" />
                  Account Opened
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {summary.accountOpeningDate ? format(parseISO(summary.accountOpeningDate), "MMM d, yyyy") : "—"}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
