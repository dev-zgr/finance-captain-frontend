"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Car,
  CircleHelp,
  Clapperboard,
  DollarSign,
  HeartPulse,
  Home,
  Inbox,
  Lightbulb,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
  type LucideIcon,
  Building2,
  ExternalLink,
} from "lucide-react"

import { getCheckingTransactions } from "@/lib/checking-account/api";
import { isExpenseCheckingCategory, isIncomeCheckingCategory } from "@/lib/checking-account/constants";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  GetCheckingTransactionsResponseDTO,
  TransactionDTO,
} from "@/lib/checking-account/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type RecentTransactionsTableProps = {
  token: string;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const CATEGORY_STYLES: Record<string, { icon: LucideIcon; className: string }> = {
  FOOD: { icon: UtensilsCrossed, className: "border-amber-500/30 bg-amber-500/10 text-amber-700" },
  TRANSPORT: { icon: Car, className: "border-sky-500/30 bg-sky-500/10 text-sky-700" },
  UTILITIES: { icon: Lightbulb, className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700" },
  RENT: { icon: Home, className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700" },
  HEALTHCARE: { icon: HeartPulse, className: "border-red-500/30 bg-red-500/10 text-red-700" },
  ENTERTAINMENT: { icon: Clapperboard, className: "border-purple-500/30 bg-purple-500/10 text-purple-700" },
  SHOPPING: { icon: ShoppingBag, className: "border-pink-500/30 bg-pink-500/10 text-pink-700" },
  TRANSFERS: { icon: ArrowLeftRight, className: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700" },
  SALARY: { icon: DollarSign, className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" },
  INVESTMENT: { icon: TrendingUp, className: "border-lime-500/30 bg-lime-500/10 text-lime-700" },
  RENTAL: { icon: Building2, className: "border-teal-500/30 bg-teal-500/10 text-teal-700" },
  OTHER: { icon: CircleHelp, className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-700" },
};

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTransactionDate(value: string): string {
  try {
    return format(parseISO(value), "MMM dd, yyyy");
  } catch {
    return value;
  }
}

function getErrorMessage(status: number, payload?: ApiErrorResponse): string {
  if (status === 400) {
    return payload?.message ?? "Invalid request parameters.";
  }

  if (status === 401) {
    return payload?.message ?? "Your session has expired. Please log in again.";
  }

  if (status === 500) {
    return payload?.message ?? "An unexpected error occurred while retrieving transactions.";
  }

  return payload?.message ?? "Could not load recent transactions.";
}

function getCategoryKey(category: string): string {
  return category.trim().toUpperCase();
}

function getCategoryVisuals(category: string): { icon: LucideIcon; className: string } {
  return CATEGORY_STYLES[getCategoryKey(category)] ?? CATEGORY_STYLES.OTHER;
}

function isExpenseTransaction(transaction: TransactionDTO): boolean {
  const categoryKey = getCategoryKey(transaction.category);

  if (transaction.amount < 0) {
    return true;
  }

  if (transaction.amount > 0 && isIncomeCheckingCategory(categoryKey)) {
    return false;
  }

  if (transaction.amount > 0 && isExpenseCheckingCategory(categoryKey)) {
    return true;
  }

  if (transaction.amount > 0) {
    return false;
  }

  return isExpenseCheckingCategory(categoryKey);
}

export function RecentTransactionsTable({ token }: RecentTransactionsTableProps) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);

  const fetchTransactions = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await getCheckingTransactions(
        token,
        { page: 0, sortBy: "date", sortDirection: "DESC" },
        controller.signal
      );

      if (controller.signal.aborted) {
        return;
      }

      if (response.status === 200) {
        const body = response.data as ApiSuccessResponse<GetCheckingTransactionsResponseDTO>;
        setTransactions(body.content?.transactions ?? []);
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
      if (controller.signal.aborted) {
        return;
      }

      setTransactions([]);
      setErrorMessage("An unexpected error occurred while retrieving transactions.");
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const displayRows = useMemo(() => transactions.slice(0, 10), [transactions]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your 10 most recent checking account activities.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/checking-account/transactions">
              Get details
              <ExternalLink data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="max-w-full overflow-x-auto">
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center">
            <Spinner className="size-5" />
            <p className="mt-4 text-sm text-muted-foreground">Loading recent transactions...</p>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="pl-6">Description</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10">
                    <Empty className="border-0 p-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Inbox />
                        </EmptyMedia>
                        <EmptyTitle>No transactions found</EmptyTitle>
                        <EmptyDescription>No recent checking account activity was returned.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                displayRows.map((transaction) => {
                  const isExpense = isExpenseTransaction(transaction);
                  const isIncome = !isExpense;
                  const categoryVisuals = getCategoryVisuals(transaction.category);
                  const CategoryIcon = categoryVisuals.icon;
                  const categoryClassName = categoryVisuals.className;
                  const signedAmount = isExpense
                    ? -Math.abs(Number(transaction.amount ?? 0))
                    : Math.abs(Number(transaction.amount ?? 0));

                  return (
                    <TableRow key={transaction.transactionId}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{transaction.transactionId}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            isIncome
                              ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15"
                              : "bg-red-500/10 text-red-700 hover:bg-red-500/10"
                          )}
                        >
                          {isIncome ? "INCOME" : "EXPENSE"}
                          {isIncome ? <ArrowUpRight data-icon="inline-end" /> : <ArrowDownRight data-icon="inline-end" />}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={categoryClassName}>
                          <CategoryIcon data-icon="inline-start" />
                          {toTitleCase(transaction.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTransactionDate(transaction.date)}</TableCell>
                      <TableCell
                        className={cn(
                          "pr-6 font-medium",
                          isIncome ? "text-emerald-600" : "text-red-600"
                        )}
                      >
                        {currencyFormatter.format(signedAmount)}
                      </TableCell>
                      <TableCell className="pl-6">
                        <Link
                          href={`/checking-account/transactions/${transaction.transactionId}`}
                          className="block max-w-[200px] truncate font-medium text-primary hover:underline"
                        >
                          {transaction.description}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link className={"text-gray-600"} href={`/checking-account/transactions/${transaction.transactionId}`}>
                            Get details
                            <ExternalLink className={"text-gray-800"}/>
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
