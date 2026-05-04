"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { format, parseISO } from "date-fns";
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Inbox,
  Landmark,
  LineChart,
  Wallet,
} from "lucide-react";

import { TransactionTypeBadge } from "@/components/components/checking-account/transaction-type-badge";
import { DebtsTransactionTypeBadge } from "@/components/components/debts-account/debts-transaction-type-badge";
import { InvestmentTransactionCategoryBadge } from "@/components/components/investment-account/transactions/investment-transaction-category-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApiErrorResponse } from "@/lib/checking-account/types";
import { getDashboardTransactions } from "@/lib/dashboard/api";
import type {
  DashboardAccountType,
  DashboardTransactionCategory,
  UnifiedTransaction,
  UnifiedTransactionsContent,
} from "@/lib/dashboard/types";
import type { RootState } from "@/lib/store";
import { cn } from "@/lib/utils";

type Props = {
  refreshKey?: number;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const POSITIVE_CATEGORIES: ReadonlySet<DashboardTransactionCategory> = new Set([
  "INCOME",
  "PAYMENT",
  "DEPOSIT",
  "SELL",
]);

function amountClass(category: DashboardTransactionCategory): string {
  return POSITIVE_CATEGORIES.has(category)
    ? "text-emerald-600 dark:text-emerald-500"
    : "text-red-600 dark:text-red-500";
}

function signedAmount(
  amount: number,
  category: DashboardTransactionCategory,
): string {
  const sign = POSITIVE_CATEGORIES.has(category) ? "+" : "−";
  return `${sign}${currencyFormatter.format(Math.abs(amount))}`;
}

function formatDate(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}

function detailHref(transaction: UnifiedTransaction): string {
  switch (transaction.accountType) {
    case "CHECKING":
      return `/checking-account/transactions/${transaction.transactionId}`;
    case "DEBTS":
      return `/debt-account/transactions/${transaction.transactionId}`;
    case "INVESTMENT":
      return `/investment-account/transactions/${transaction.transactionId}`;
  }
}

function AccountBadge({ type }: { type: DashboardAccountType }) {
  if (type === "CHECKING") {
    return (
      <Badge
        variant="outline"
        className="border-sky-500/30 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10"
      >
        <Wallet data-icon="inline-start" />
        Checking
      </Badge>
    );
  }

  if (type === "DEBTS") {
    return (
      <Badge
        variant="outline"
        className="border-rose-500/30 bg-rose-500/10 text-rose-700 hover:bg-rose-500/10"
      >
        <Landmark data-icon="inline-start" />
        Debts
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-violet-500/30 bg-violet-500/10 text-violet-700 hover:bg-violet-500/10"
    >
      <LineChart data-icon="inline-start" />
      Investment
    </Badge>
  );
}

function CategoryBadge({
  accountType,
  category,
}: {
  accountType: DashboardAccountType;
  category: DashboardTransactionCategory;
}) {
  if (accountType === "CHECKING") {
    return (
      <TransactionTypeBadge
        category={category}
        transactionType={category as "INCOME" | "EXPENSE"}
      />
    );
  }

  if (accountType === "DEBTS") {
    return (
      <DebtsTransactionTypeBadge
        transactionType={category as "DEBT" | "PAYMENT"}
      />
    );
  }

  return (
    <InvestmentTransactionCategoryBadge
      category={category as "DEPOSIT" | "WITHDRAW" | "BUY" | "SELL"}
    />
  );
}

function getErrorMessage(status: number, payload?: ApiErrorResponse): string {
  if (status === 400) {
    return payload?.message ?? "Invalid request parameters.";
  }
  if (status === 401) {
    return payload?.message ?? "Your session has expired. Please log in again.";
  }
  if (status === 500) {
    return (
      payload?.message ??
      "An unexpected error occurred while retrieving transactions."
    );
  }
  return payload?.message ?? "Could not load recent transactions.";
}

function extractContent(data: unknown): UnifiedTransactionsContent | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const wrapped = data as { content?: UnifiedTransactionsContent };
  if (wrapped.content && Array.isArray(wrapped.content.transactions)) {
    return wrapped.content;
  }
  return null;
}

export function DashboardRecentTransactionsTable({ refreshKey }: Props) {
  const token = useSelector(
    (state: RootState) => state.auth.content?.token ?? "",
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);

  const fetchTransactions = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await getDashboardTransactions(
        token,
        { page: 0, size: 10 },
        controller.signal,
      );

      if (controller.signal.aborted) return;

      if (response.status === 200) {
        const content = extractContent(response.data);
        setTransactions(content?.transactions ?? []);
        return;
      }

      if (response.status === 204) {
        setTransactions([]);
        return;
      }

      const body = response.data as ApiErrorResponse;
      setTransactions([]);
      setErrorMessage(getErrorMessage(response.status, body));
    } catch {
      if (controller.signal.aborted) return;
      setTransactions([]);
      setErrorMessage(
        "An unexpected error occurred while retrieving transactions.",
      );
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setTransactions([]);
      return;
    }
    void fetchTransactions();
  }, [fetchTransactions, refreshKey, token]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const displayRows = useMemo(() => transactions.slice(0, 10), [transactions]);

  return (
    <Card className="col-span-12">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your 10 most recent transactions across all accounts.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/checking-account/transactions">
                View Checkings
                <ExternalLink data-icon="inline-end" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/debt-account/transactions">
                View Debts
                <ExternalLink data-icon="inline-end" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/investment-account/transactions">
                View Investments
                <ExternalLink data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-w-full overflow-x-auto">
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center">
            <Spinner className="size-5" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading recent transactions...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <AlertCircle className="text-destructive" />
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={fetchTransactions}>
              Retry
            </Button>
          </div>
        ) : (
          <Table className="min-w-[980px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Date</TableHead>
                <TableHead className="w-[130px]">Account</TableHead>
                <TableHead className="w-[140px]">Category</TableHead>
                <TableHead className="w-[140px] pr-4">Amount</TableHead>
                <TableHead className="w-[280px] pl-4">Description</TableHead>
                <TableHead className="w-[110px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10">
                    <Empty className="border-0 p-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Inbox />
                        </EmptyMedia>
                        <EmptyTitle>No recent activity</EmptyTitle>
                        <EmptyDescription>
                          Once you start adding income, debts, or trades,
                          they&apos;ll show up here.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                displayRows.map((transaction) => {
                  const amount = Number(transaction.amount ?? 0);
                  const href = detailHref(transaction);
                  const description = transaction.description?.trim() || "—";

                  return (
                    <TableRow
                      key={`${transaction.accountType}-${transaction.transactionId}`}
                    >
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>
                        <AccountBadge type={transaction.accountType} />
                      </TableCell>
                      <TableCell>
                        <CategoryBadge
                          accountType={transaction.accountType}
                          category={transaction.transactionCategory}
                        />
                      </TableCell>
                      <TableCell
                        className={cn(
                          "pr-4 font-medium tabular-nums",
                          amountClass(transaction.transactionCategory),
                        )}
                      >
                        {signedAmount(amount, transaction.transactionCategory)}
                      </TableCell>
                      <TableCell className="pl-4">
                        <span
                          title={description === "—" ? undefined : description}
                          className={cn(
                            "block max-w-[280px] truncate font-medium",
                            description === "—" && "text-muted-foreground",
                          )}
                        >
                          {description}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={href}>
                            Details
                            <ArrowRight data-icon="inline-end" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
