"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  AlertCircle,
  Inbox,
  ExternalLink,
  ArrowRight,
} from "lucide-react"

import { extractCheckingTransactionsResponse, getCheckingTransactions } from "@/lib/checking-account/api";
import { getSignedAmountFromCategory, getTransactionTypeFromCategory } from "@/lib/checking-account/transaction-presentation";
import type {
  ApiErrorResponse,
  TransactionDTO,
} from "@/lib/checking-account/types";
import { cn } from "@/lib/utils";
import { TransactionCategoryBadge } from "@/components/components/checking-account/transaction-category-badge";
import { TransactionTypeBadge } from "@/components/components/checking-account/transaction-type-badge";
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
        const payload = extractCheckingTransactionsResponse(response.data);
        setTransactions(payload?.transactions ?? []);
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
              Get more details
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
          <Table className="table-fixed min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Transaction ID</TableHead>
                <TableHead className="w-[130px]">Type</TableHead>
                <TableHead className="w-[170px]">Category</TableHead>
                <TableHead className="w-[130px]">Date</TableHead>
                <TableHead className="w-[140px] pr-4">Amount</TableHead>
                <TableHead className="w-[260px] pl-4">Description</TableHead>
                <TableHead className="w-[110px]">Details</TableHead>
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
                  const transactionType = getTransactionTypeFromCategory(transaction.category);
                  const signedAmount = getSignedAmountFromCategory(Number(transaction.amount ?? 0), transaction.category);

                  return (
                    <TableRow key={transaction.transactionId}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{transaction.transactionId}
                      </TableCell>
                      <TableCell>
                        <TransactionTypeBadge category={transaction.category} />
                      </TableCell>
                      <TableCell>
                        <TransactionCategoryBadge category={transaction.category} />
                      </TableCell>
                      <TableCell>{formatTransactionDate(transaction.date)}</TableCell>
                      <TableCell
                        className={cn(
                          "pr-4 font-medium",
                          transactionType === "INCOME" ? "text-emerald-600" : "text-red-600"
                        )}
                      >
                        {currencyFormatter.format(signedAmount)}
                      </TableCell>
                      <TableCell className="pl-4">
                        <Link
                          href={`/checking-account/transactions/${transaction.transactionId}`}
                          className="block max-w-[240px] truncate font-medium text-primary hover:underline"
                        >
                          {transaction.description}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/checking-account/transactions/${transaction.transactionId}`}>
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
