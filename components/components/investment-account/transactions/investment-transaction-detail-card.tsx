"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format, parseISO } from "date-fns"
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Calendar,
  FileText,
  Hash,
  SearchX,
  Tag,
  Wallet,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"

import { TransactionCategoryBadge } from "@/components/components/checking-account/transaction-category-badge"
import { TransactionTypeBadge } from "@/components/components/checking-account/transaction-type-badge"
import { InvestmentTransactionCategoryBadge } from "@/components/components/investment-account/transactions/investment-transaction-category-badge"
import { InvestmentTransactionTypeBadge } from "@/components/components/investment-account/transactions/investment-transaction-type-badge"
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
  ItemTitle,
} from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getAccountSummary,
  getCheckingTransactionById,
} from "@/lib/checking-account/api"
import type {
  AccountSummary,
  ApiSuccessResponse,
  TransactionDetail,
  TransactionType,
} from "@/lib/checking-account/types"
import { resolveTransactionType } from "@/lib/checking-account/transaction-presentation"
import {
  extractInvestmentTransactionDetailContent,
  getInvestmentSummary,
  getInvestmentTransactionById,
} from "@/lib/investment-account/api"
import type {
  InvestmentSummary,
  InvestmentTransactionCategory,
  InvestmentTransactionDetailContent,
} from "@/lib/investment-account/types"
import type { RootState } from "@/lib/store"
import { cn } from "@/lib/utils"

type InvestmentTransactionDetailCardProps = {
  transactionId: string
}

type BalanceState = {
  investment: InvestmentSummary | null
  checking: AccountSummary | null
  loading: boolean
  error: string | null
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

function formatTransactionDate(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy · h:mm a")
  } catch {
    return value
  }
}

function formatSignedTransferAmount(
  amount: number,
  category: InvestmentTransactionCategory
): string {
  const sign = category === "DEPOSIT" ? "+" : "−"
  return `${sign}${formatCurrency(amount)}`
}

function formatProfitLoss(value: number): string {
  const sign = value >= 0 ? "+" : "−"
  return `${sign}${formatCurrency(value)}`
}

function getWrappedContent<T>(data: unknown): T | null {
  if (!data || typeof data !== "object") {
    return null
  }

  const wrapped = data as ApiSuccessResponse<T> & { data?: T }
  return wrapped.content ?? wrapped.data ?? null
}

function getDetailErrorMessage(status: number): string {
  if (status === 401) {
    return "Your session has expired. Please log in again."
  }

  return "Could not load transaction details. Please try again."
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

export function InvestmentTransactionDetailCard({
  transactionId,
}: InvestmentTransactionDetailCardProps) {
  const router = useRouter()
  const token = useSelector(
    (state: RootState) => state.auth.content?.token ?? ""
  )

  const detailAbortControllerRef = useRef<AbortController | null>(null)
  const balancesAbortControllerRef = useRef<AbortController | null>(null)
  const linkedAbortControllerRef = useRef<AbortController | null>(null)

  const [detail, setDetail] = useState<InvestmentTransactionDetailContent | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [balances, setBalances] = useState<BalanceState>({
    investment: null,
    checking: null,
    loading: false,
    error: null,
  })

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
      const response = await getInvestmentTransactionById(
        token,
        Number(transactionId),
        controller.signal
      )

      if (controller.signal.aborted) {
        return
      }

      if (response.status === 200) {
        setSessionExpired(false)
        const payload = extractInvestmentTransactionDetailContent(response.data)

        if (!payload?.transaction) {
          setDetail(null)
          setErrorMessage("Could not load transaction details. Please try again.")
          return
        }

        setDetail(payload)
        return
      }

      setDetail(null)

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

      setDetail(null)
      setErrorMessage("Could not load transaction details. Please try again.")
    } finally {
      if (detailAbortControllerRef.current === controller) {
        setLoading(false)
      }
    }
  }, [token, transactionId])

  const fetchBalances = useCallback(async () => {
    balancesAbortControllerRef.current?.abort()
    const controller = new AbortController()
    balancesAbortControllerRef.current = controller

    setBalances((current) => ({ ...current, loading: true, error: null }))

    try {
      const [investmentResponse, checkingResponse] = await Promise.all([
        getInvestmentSummary(token, controller.signal),
        getAccountSummary(token, controller.signal),
      ])

      if (controller.signal.aborted) {
        return
      }

      if (investmentResponse.status === 401 || checkingResponse.status === 401) {
        setSessionExpired(true)
      }

      setBalances({
        investment:
          investmentResponse.status === 200
            ? getWrappedContent<InvestmentSummary>(investmentResponse.data)
            : null,
        checking:
          checkingResponse.status === 200
            ? getWrappedContent<AccountSummary>(checkingResponse.data)
            : null,
        loading: false,
        error:
          investmentResponse.status === 200 && checkingResponse.status === 200
            ? null
            : "Balance unavailable.",
      })
    } catch {
      if (controller.signal.aborted) {
        return
      }

      setBalances((current) => ({
        ...current,
        loading: false,
        error: "Balance unavailable.",
      }))
    }
  }, [token])

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
          const payload = (response.data as ApiSuccessResponse<TransactionDetail>)
            .content

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

  const transaction = detail?.transaction
  const category = transaction?.investmentTransactionCategory
  const transactionType = transaction?.investmentTransactionType
  const safeCategory = category ?? "BUY"
  const safeType = transactionType ?? "TRADE"

  const isTransfer = category === "DEPOSIT" || category === "WITHDRAW"
  const isTrade = category === "BUY" || category === "SELL"

  useEffect(() => {
    if (!transaction || sessionExpired || !isTransfer) {
      balancesAbortControllerRef.current?.abort()
      setBalances((current) => ({ ...current, loading: false }))
      return
    }

    void fetchBalances()
  }, [fetchBalances, isTransfer, sessionExpired, transaction])

  const linkedCheckingTransactionId = useMemo(() => {
    if (!transaction) {
      return null
    }

    if (typeof transaction.linkedCheckingTransactionId === "number") {
      return transaction.linkedCheckingTransactionId
    }

    return (
      detail?.linkedCheckingTransaction?.transactionId ??
      detail?.linkedCheckingTransaction?.id ??
      null
    )
  }, [
    detail?.linkedCheckingTransaction?.id,
    detail?.linkedCheckingTransaction?.transactionId,
    transaction,
  ])

  const linkedCheckingDisplay = useMemo(() => {
    if (linkedTransaction.transaction) {
      return linkedTransaction.transaction
    }

    const linked = detail?.linkedCheckingTransaction
    const linkedId = linked?.transactionId ?? linked?.id
    if (!linked || !linkedId) {
      return null
    }

    return {
      transactionId: linkedId,
      category: linked.category ?? "TRANSFERS",
      transactionType: (linked.transactionType as TransactionType | undefined) ?? undefined,
      amount: Number(linked.amount ?? 0),
      description: linked.description ?? null,
      date: linked.date ?? linked.transactionDate ?? "",
    } as TransactionDetail
  }, [detail?.linkedCheckingTransaction, linkedTransaction.transaction])

  useEffect(() => {
    if (!transaction || sessionExpired || !isTransfer) {
      linkedAbortControllerRef.current?.abort()
      setLinkedTransaction({ transaction: null, loading: false, error: null })
      return
    }

    if (!linkedCheckingTransactionId) {
      setLinkedTransaction({
        transaction: null,
        loading: false,
        error: "Linked transaction unavailable.",
      })
      return
    }

    void fetchLinkedTransaction(linkedCheckingTransactionId)
  }, [
    fetchLinkedTransaction,
    isTransfer,
    linkedCheckingTransactionId,
    sessionExpired,
    transaction,
  ])

  useEffect(() => {
    if (!sessionExpired) {
      return
    }

    balancesAbortControllerRef.current?.abort()
    linkedAbortControllerRef.current?.abort()
  }, [sessionExpired])

  useEffect(() => {
    return () => {
      detailAbortControllerRef.current?.abort()
      balancesAbortControllerRef.current?.abort()
      linkedAbortControllerRef.current?.abort()
    }
  }, [])

  const accountItems =
    category === "DEPOSIT"
      ? [
          {
            key: "checking",
            title: "Checking Account",
            description: "Source checking balance",
            balance: balances.checking?.accountBalance,
          },
          {
            key: "investment",
            title: "Investment Account",
            description: "Destination investment cash",
            balance: balances.investment?.cashBalance,
          },
        ]
      : [
          {
            key: "investment",
            title: "Investment Account",
            description: "Source investment cash",
            balance: balances.investment?.cashBalance,
          },
          {
            key: "checking",
            title: "Checking Account",
            description: "Destination checking balance",
            balance: balances.checking?.accountBalance,
          },
        ]

  return (
    <div className="mx-auto max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push("/investment-account/transactions")}
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
                  onClick={() => router.push("/investment-account/transactions")}
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
                      category === "DEPOSIT" || category === "SELL"
                        ? "text-green-600 dark:text-green-500"
                        : "text-red-600 dark:text-red-500"
                    )}
                  >
                    {isTransfer
                      ? formatSignedTransferAmount(transaction.amount, safeCategory)
                      : formatCurrency(transaction.amount)}
                  </p>
                  <div className="flex items-center gap-2">
                    <InvestmentTransactionTypeBadge type={safeType} />
                    <InvestmentTransactionCategoryBadge category={safeCategory} />
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="size-4" />
                      Date
                    </span>
                    <span className="text-right text-sm font-medium">
                      {formatTransactionDate(transaction.transactionDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-2">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="size-4" />
                      Category
                    </span>
                    <InvestmentTransactionCategoryBadge category={safeCategory} />
                  </div>

                  {isTrade && transaction.ticker ? (
                    <div className="flex items-center justify-between gap-4 py-2">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="size-4" />
                        Symbol
                      </span>
                      <span className="text-right text-sm font-medium">{transaction.ticker}</span>
                    </div>
                  ) : null}

                  {isTrade && typeof transaction.quantity === "number" ? (
                    <div className="flex items-center justify-between gap-4 py-2">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wallet className="size-4" />
                        Quantity
                      </span>
                      <span className="text-right text-sm font-medium tabular-nums">
                        {transaction.quantity.toLocaleString()}
                      </span>
                    </div>
                  ) : null}

                  {isTrade && typeof transaction.pricePerShare === "number" ? (
                    <div className="flex items-center justify-between gap-4 py-2">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="size-4" />
                        Price/Share
                      </span>
                      <span className="text-right text-sm font-medium tabular-nums">
                        {formatCurrency(transaction.pricePerShare)}
                      </span>
                    </div>
                  ) : null}

                  {category === "SELL" &&
                  typeof (detail?.realizedProfitLoss ?? transaction.realizedProfitLoss) ===
                    "number" ? (
                    <div className="flex items-center justify-between gap-4 py-2">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="size-4" />
                        Realized P/L
                      </span>
                      <span
                        className={cn(
                          "text-right text-sm font-medium tabular-nums",
                          Number(
                            detail?.realizedProfitLoss ?? transaction.realizedProfitLoss
                          ) >= 0
                            ? "text-green-600 dark:text-green-500"
                            : "text-red-600 dark:text-red-500"
                        )}
                      >
                        {formatProfitLoss(
                          Number(
                            detail?.realizedProfitLoss ?? transaction.realizedProfitLoss
                          )
                        )}
                      </span>
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
                      {transaction.transactionId}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {transaction && isTransfer ? (
          <Card>
            <CardHeader>
              <CardTitle>Accounts Involved</CardTitle>
              <CardDescription>
                {category === "DEPOSIT"
                  ? "Funds were transferred from your checking account into your investment account."
                  : "Funds were transferred from your investment account into your checking account."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ItemGroup>
                {accountItems.map((item, index) => (
                  <div key={item.key} className="flex flex-col gap-3">
                    <Item variant="outline">
                      <ItemContent>
                        <ItemTitle>{item.title}</ItemTitle>
                        <ItemDescription>{item.description}</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        {balances.loading ? (
                          <Skeleton className="h-5 w-24" />
                        ) : item.balance === undefined ? (
                          <span className="text-right text-sm text-muted-foreground">—</span>
                        ) : (
                          <span className="text-right text-sm font-medium tabular-nums">
                            {currencyFormatter.format(item.balance)}
                          </span>
                        )}
                      </ItemActions>
                    </Item>

                    {index === 0 ? (
                      <ArrowDown className="mx-auto size-4 text-muted-foreground" />
                    ) : null}
                  </div>
                ))}
              </ItemGroup>
              {balances.error ? (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{balances.error}</p>
                  <Button variant="outline" size="sm" onClick={() => void fetchBalances()}>
                    Retry
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {transaction && isTransfer ? (
          <Card>
            <CardHeader>
              <CardTitle>Linked Checking Transaction</CardTitle>
              <CardDescription>The matching entry in your checking account.</CardDescription>
            </CardHeader>
            <CardContent>
              {linkedTransaction.loading ? (
                <LinkedTransactionSkeleton />
              ) : linkedCheckingDisplay ? (
                <Item variant="outline" className="items-start gap-4">
                  <ItemContent className="min-w-0">
                    <ItemTitle className="flex-wrap items-start">
                      <TransactionTypeBadge
                        category={linkedCheckingDisplay.category}
                        transactionType={linkedCheckingDisplay.transactionType}
                      />
                      <TransactionCategoryBadge category={linkedCheckingDisplay.category} />
                    </ItemTitle>
                    <ItemDescription className="max-w-[300px] truncate text-left">
                      {linkedCheckingDisplay.description?.trim() || "—"}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions className="ml-auto flex-col items-center justify-center gap-1 self-center">
                    <span
                      className={cn(
                        "text-right text-sm font-medium tabular-nums",
                        resolveTransactionType(
                          linkedCheckingDisplay.transactionType,
                          linkedCheckingDisplay.category
                        ) === "INCOME"
                          ? "text-green-600 dark:text-green-500"
                          : "text-red-600 dark:text-red-500"
                      )}
                    >
                      {resolveTransactionType(
                        linkedCheckingDisplay.transactionType,
                        linkedCheckingDisplay.category
                      ) === "INCOME"
                        ? "+"
                        : "−"}
                      {formatCurrency(linkedCheckingDisplay.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/checking-account/transactions/${linkedCheckingDisplay.transactionId}`
                        )
                      }
                    >
                      View
                      <ArrowRight data-icon="inline-end" />
                    </Button>
                  </ItemActions>
                </Item>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {linkedTransaction.error ?? "Linked transaction unavailable."}
                  </p>
                  {linkedCheckingTransactionId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void fetchLinkedTransaction(linkedCheckingTransactionId)}
                    >
                      Retry
                    </Button>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
