"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { format, parseISO } from "date-fns"
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Calendar,
  FileText,
  Hash,
  Landmark,
  SearchX,
  Tag,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"

import { TransactionCategoryBadge } from "@/components/components/checking-account/transaction-category-badge"
import { TransactionTypeBadge } from "@/components/components/checking-account/transaction-type-badge"
import { DebtsCategoryBadge } from "@/components/components/debts-account/debts-category-badge"
import { DebtsTransactionTypeBadge } from "@/components/components/debts-account/debts-transaction-type-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getCheckingTransactionById,
} from "@/lib/checking-account/api"
import type {
  ApiSuccessResponse,
  TransactionDetail,
} from "@/lib/checking-account/types"
import {
  getDebtsTransactionById,
} from "@/lib/debts-account/api"
import type {
  DebtsApiSuccessResponse,
  DebtsTransactionDetail,
  DebtsTransactionType,
} from "@/lib/debts-account/types"
import type { RootState } from "@/lib/store"
import { cn } from "@/lib/utils"

type DebtsTransactionDetailCardProps = {
  transactionId: string
}

type LinkedTransactionState = {
  transaction: TransactionDetail | null
  loading: boolean
  error: string | null
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function formatCurrency(value: number): string {
  return currencyFormatter.format(Math.abs(Number(value ?? 0)))
}

function formatSignedDebtsAmount(
  amount: number,
  transactionType: DebtsTransactionType
): string {
  return `${transactionType === "PAYMENT" ? "+" : "−"}${formatCurrency(amount)}`
}

function formatSignedCheckingAmount(amount: number, isIncome: boolean): string {
  return `${isIncome ? "+" : "−"}${formatCurrency(amount)}`
}

function formatTransactionDate(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy · h:mm a")
  } catch {
    return value
  }
}

function getDetailErrorMessage(status: number): string {
  if (status === 401) {
    return "Your session has expired. Please log in again."
  }

  return "Could not load transaction details. Please try again."
}

function getDebtsPayload<T>(
  data: DebtsApiSuccessResponse<T> | ApiSuccessResponse<T>
): T | null {
  const payload = data as DebtsApiSuccessResponse<T>

  return payload.data ?? payload.content ?? null
}

function TransactionDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
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
  )
}

function LinkedTransactionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  )
}

export function DebtsTransactionDetailCard({
  transactionId,
}: DebtsTransactionDetailCardProps) {
  const router = useRouter()
  const token = useSelector(
    (state: RootState) => state.auth.content?.token ?? ""
  )
  const detailAbortControllerRef = useRef<AbortController | null>(null)
  const linkedAbortControllerRef = useRef<AbortController | null>(null)
  const [transaction, setTransaction] = useState<DebtsTransactionDetail | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [linkedTransaction, setLinkedTransaction] =
    useState<LinkedTransactionState>({
      transaction: null,
      loading: false,
      error: null,
    })

  const fetchTransactionDetails = useCallback(async () => {
    detailAbortControllerRef.current?.abort()
    const controller = new AbortController()
    detailAbortControllerRef.current = controller

    setLoading(true)
    setErrorMessage(null)
    setNotFound(false)

    try {
      const response = await getDebtsTransactionById(
        token,
        transactionId,
        controller.signal
      )

      if (controller.signal.aborted) {
        return
      }

      if (response.status === 200) {
        const payload = getDebtsPayload<DebtsTransactionDetail>(
          response.data as DebtsApiSuccessResponse<DebtsTransactionDetail>
        )

        if (!payload) {
          setTransaction(null)
          setErrorMessage(
            "Could not load transaction details. Please try again."
          )
          return
        }

        setTransaction(payload)
        return
      }

      setTransaction(null)

      if (response.status === 401) {
        setSessionExpired(true)
      }

      if (response.status === 404) {
        setNotFound(true)
        return
      }

      setErrorMessage(getDetailErrorMessage(response.status))
    } catch {
      if (controller.signal.aborted) {
        return
      }

      setTransaction(null)
      setErrorMessage("Could not load transaction details. Please try again.")
    } finally {
      if (detailAbortControllerRef.current === controller) {
        setLoading(false)
      }
    }
  }, [token, transactionId])

  const fetchLinkedTransaction = useCallback(
    async (linkedCheckingTransactionId: number) => {
      linkedAbortControllerRef.current?.abort()
      const controller = new AbortController()
      linkedAbortControllerRef.current = controller

      setLinkedTransaction({
        transaction: null,
        loading: true,
        error: null,
      })

      try {
        const response = await getCheckingTransactionById(
          token,
          String(linkedCheckingTransactionId),
          controller.signal
        )

        if (controller.signal.aborted) {
          return
        }

        if (response.status === 401) {
          setSessionExpired(true)
        }

        if (response.status === 200) {
          const payload = (
            response.data as ApiSuccessResponse<TransactionDetail>
          ).content

          setLinkedTransaction({
            transaction: payload ?? null,
            loading: false,
            error: payload ? null : "Linked transaction unavailable.",
          })
          return
        }

        setLinkedTransaction({
          transaction: null,
          loading: false,
          error: "Linked transaction unavailable.",
        })
      } catch {
        if (controller.signal.aborted) {
          return
        }

        setLinkedTransaction({
          transaction: null,
          loading: false,
          error: "Linked transaction unavailable.",
        })
      }
    },
    [token]
  )

  useEffect(() => {
    void fetchTransactionDetails()
  }, [fetchTransactionDetails])

  useEffect(() => {
    const linkedCheckingTransactionId = transaction?.linkedCheckingTransactionId

    if (!linkedCheckingTransactionId) {
      linkedAbortControllerRef.current?.abort()
      setLinkedTransaction({
        transaction: null,
        loading: false,
        error: "Linked transaction unavailable.",
      })
      return
    }

    void fetchLinkedTransaction(linkedCheckingTransactionId)
  }, [fetchLinkedTransaction, transaction?.linkedCheckingTransactionId])

  useEffect(() => {
    return () => {
      detailAbortControllerRef.current?.abort()
      linkedAbortControllerRef.current?.abort()
    }
  }, [])

  const transactionType = transaction?.transactionType ?? "DEBT"
  const linkedCheckingIsIncome = transactionType === "DEBT"
  const accountItems =
    transactionType === "DEBT"
      ? [
          {
            key: "debts",
            title: "Debts Account",
            description: "Source of borrowed funds",
            icon: Landmark,
            iconClassName: "text-red-600 dark:text-red-500",
            amount: transaction?.amount ?? 0,
            isIncome: false,
          },
          {
            key: "checking",
            title: "Checking Account",
            description: "Destination checking balance",
            icon: Wallet,
            iconClassName: "text-primary",
            amount: transaction?.amount ?? 0,
            isIncome: true,
          },
        ]
      : [
          {
            key: "checking",
            title: "Checking Account",
            description: "Source checking balance",
            icon: Wallet,
            iconClassName: "text-primary",
            amount: transaction?.amount ?? 0,
            isIncome: false,
          },
          {
            key: "debts",
            title: "Debts Account",
            description: "Payment reduces liabilities",
            icon: Landmark,
            iconClassName: "text-red-600 dark:text-red-500",
            amount: transaction?.amount ?? 0,
            isIncome: true,
          },
        ]

  return (
    <div className="mx-auto max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push("/debt-account/transactions")}
      >
        <ArrowLeft data-icon="inline-start" />
        Back to Transactions
      </Button>

      <div className="flex flex-col gap-4">
        {sessionExpired ? (
          <Card role="alert" className="border-destructive/30">
            <CardContent className="flex items-center gap-2 py-3 text-sm text-destructive">
              <AlertCircle />
              Your session has expired. Please log in again.
            </CardContent>
          </Card>
        ) : null}

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
                  No transaction with ID {transactionId} exists, or it does not
                  belong to your account.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/debt-account/transactions")}
                >
                  Back to Transactions
                </Button>
              </div>
            ) : errorMessage ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
                <AlertCircle className="mx-auto size-10 text-destructive" />
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchTransactionDetails()}
                >
                  Retry
                </Button>
              </div>
            ) : transaction ? (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                  <p
                    className={cn(
                      "text-3xl font-semibold tracking-tight tabular-nums",
                      transactionType === "PAYMENT"
                        ? "text-green-600 dark:text-green-500"
                        : "text-red-600 dark:text-red-500"
                    )}
                  >
                    {formatSignedDebtsAmount(
                      transaction.amount,
                      transactionType
                    )}
                  </p>
                  <DebtsTransactionTypeBadge
                    transactionType={transaction.transactionType}
                  />
                </div>

                <Separator />

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="size-4" />
                      Date
                    </span>
                    <span className="text-right text-sm font-medium">
                      {formatTransactionDate(transaction.date)}
                    </span>
                  </div>

                  {transactionType === "DEBT" && transaction.debtCategory ? (
                    <div className="flex items-center justify-between gap-4 py-2">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="size-4" />
                        Category
                      </span>
                      <DebtsCategoryBadge
                        category={transaction.debtCategory}
                        transactionType={transaction.transactionType}
                      />
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="size-4" />
                      Description
                    </span>
                    <span
                      className={cn(
                        "text-right text-sm",
                        transaction.description?.trim()
                          ? "font-medium"
                          : "text-muted-foreground"
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
                    <span className="font-mono text-sm text-muted-foreground">
                      {transaction.debtsTransactionId}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {transaction ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Accounts Involved</CardTitle>
                <CardDescription>
                  {transactionType === "DEBT"
                    ? "Funds were transferred from your debts account into your checking account."
                    : "Funds were transferred from your checking account into your debts account."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ItemGroup>
                  {accountItems.map((item, index) => {
                    const AccountIcon = item.icon

                    return (
                      <div key={item.key} className="flex flex-col gap-3">
                        <Item variant="outline">
                          <ItemMedia variant="icon">
                            <AccountIcon className={item.iconClassName} />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>{item.title}</ItemTitle>
                            <ItemDescription>
                              {item.description}
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            <span
                              className={cn(
                                "text-right text-sm font-medium tabular-nums",
                                item.isIncome
                                  ? "text-green-600 dark:text-green-500"
                                  : "text-red-600 dark:text-red-500"
                              )}
                            >
                              {item.isIncome ? "+" : "−"}
                              {formatCurrency(item.amount)}
                            </span>
                          </ItemActions>
                        </Item>

                        {index === 0 ? (
                          <ArrowDown className="mx-auto size-4 text-muted-foreground" />
                        ) : null}
                      </div>
                    )
                  })}
                </ItemGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Linked Checking Transaction</CardTitle>
                <CardDescription>
                  The matching entry in your checking account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {linkedTransaction.loading ? (
                  <LinkedTransactionSkeleton />
                ) : linkedTransaction.transaction ? (
                  <Item variant="outline" className="items-start gap-4">
                    <ItemContent className="min-w-0">
                      <ItemTitle className="flex-wrap items-start">
                        <TransactionTypeBadge
                          category={linkedTransaction.transaction.category}
                          transactionType={
                            linkedTransaction.transaction.transactionType
                          }
                        />
                        <TransactionCategoryBadge
                          category={linkedTransaction.transaction.category}
                        />
                      </ItemTitle>
                      <ItemDescription className="max-w-[300px] truncate text-left">
                        {linkedTransaction.transaction.description?.trim() ||
                          "—"}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions className="ml-auto flex-col items-center justify-center gap-1 self-center">
                      <span
                        className={cn(
                          "text-right text-sm font-medium tabular-nums",
                          linkedCheckingIsIncome
                            ? "text-green-600 dark:text-green-500"
                            : "text-red-600 dark:text-red-500"
                        )}
                      >
                        {formatSignedCheckingAmount(
                          linkedTransaction.transaction.amount,
                          linkedCheckingIsIncome
                        )}
                      </span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/checking-account/transactions/${linkedTransaction.transaction.transactionId}`}
                        >
                          View
                          <ArrowRight data-icon="inline-end" />
                        </Link>
                      </Button>
                    </ItemActions>
                  </Item>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      {linkedTransaction.error ??
                        "Linked transaction unavailable."}
                    </p>
                    {transaction.linkedCheckingTransactionId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void fetchLinkedTransaction(
                            Number(transaction.linkedCheckingTransactionId)
                          )
                        }
                      >
                        Retry
                      </Button>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  )
}
