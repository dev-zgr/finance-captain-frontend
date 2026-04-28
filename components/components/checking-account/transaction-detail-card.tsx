"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { AlertCircle, ArrowLeft, Calendar, FileText, Hash, SearchX, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

import { TransactionCategoryBadge } from "@/components/components/checking-account/transaction-category-badge";
import { TransactionTypeBadge } from "@/components/components/checking-account/transaction-type-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getCheckingTransactionById } from "@/lib/checking-account/api";
import {
  isExpenseCheckingCategory,
  isIncomeCheckingCategory,
} from "@/lib/checking-account/constants";
import type { ApiSuccessResponse, TransactionDetail, TransactionType } from "@/lib/checking-account/types";
import type { RootState } from "@/lib/store";
import { cn } from "@/lib/utils";

type TransactionDetailCardProps = {
  transactionId: string;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatTransactionDate(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy · h:mm a");
  } catch {
    return value;
  }
}

function resolveTransactionType(transaction: TransactionDetail): TransactionType {
  if (transaction.transactionType === "INCOME" || transaction.transactionType === "EXPENSE") {
    return transaction.transactionType;
  }

  const normalizedCategory = transaction.category.trim().toUpperCase();

  if (isIncomeCheckingCategory(normalizedCategory)) {
    return "INCOME";
  }

  if (isExpenseCheckingCategory(normalizedCategory)) {
    return "EXPENSE";
  }

  return "EXPENSE";
}

function getErrorMessage(status: number): string {
  if (status === 401) {
    return "Your session has expired. Please log in again.";
  }

  return "Could not load transaction details. Please try again.";
}

function TransactionDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-7 w-24" />
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-44" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-7 w-28" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}

export function TransactionDetailCard({ transactionId }: TransactionDetailCardProps) {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.content?.token ?? "");
  const abortControllerRef = useRef<AbortController | null>(null);
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchTransactionDetails = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setErrorMessage(null);
    setNotFound(false);

    try {
      const response = await getCheckingTransactionById(token, transactionId, controller.signal);

      if (controller.signal.aborted) {
        return;
      }

      if (response.status === 200) {
        const payload = (response.data as ApiSuccessResponse<TransactionDetail>).content;

        if (!payload) {
          setTransaction(null);
          setErrorMessage("Could not load transaction details. Please try again.");
          return;
        }

        setTransaction(payload);
        return;
      }

      setTransaction(null);

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      setErrorMessage(getErrorMessage(response.status));
    } catch {
      if (controller.signal.aborted) {
        return;
      }

      setTransaction(null);
      setErrorMessage("Could not load transaction details. Please try again.");
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [token, transactionId]);

  useEffect(() => {
    void fetchTransactionDetails();
  }, [fetchTransactionDetails]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const transactionType = transaction ? resolveTransactionType(transaction) : "EXPENSE";

  return (
    <div className="mx-auto max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push("/checking-account/transactions")}
      >
        <ArrowLeft data-icon="inline-start" />
        Back to Transactions
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>Transaction #{transactionId}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TransactionDetailsSkeleton />
          ) : notFound ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
              <SearchX className="mx-auto size-10 text-muted-foreground" />
              <p className="text-base font-medium">Transaction not found</p>
              <p className="text-sm text-muted-foreground">
                No transaction with ID {transactionId} exists, or it does not belong to your account.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/checking-account/transactions")}
              >
                Back to Transactions
              </Button>
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
              <AlertCircle className="mx-auto size-10 text-destructive" />
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <Button variant="outline" size="sm" onClick={() => void fetchTransactionDetails()}>
                Retry
              </Button>
            </div>
          ) : transaction ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <p
                  className={cn(
                    "text-3xl font-semibold tracking-tight tabular-nums",
                    transactionType === "INCOME"
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500",
                  )}
                >
                  {currencyFormatter.format(Math.abs(Number(transaction.amount ?? 0)))}
                </p>
                <TransactionTypeBadge category={transaction.category} />
              </div>

              <Separator />

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 py-2">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="size-4" />
                    Date
                  </span>
                  <span className="text-right text-sm font-medium">{formatTransactionDate(transaction.date)}</span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Tag className="size-4" />
                    Category
                  </span>
                  <TransactionCategoryBadge category={transaction.category} />
                </div>

                <div className="flex items-center justify-between gap-4 py-2">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="size-4" />
                    Description
                  </span>
                  <span
                    className={cn(
                      "text-right text-sm",
                      transaction.description?.trim() ? "font-medium" : "text-muted-foreground",
                    )}
                  >
                    {transaction.description?.trim() || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="size-4" />
                    Transaction ID
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">{transaction.transactionId}</span>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
