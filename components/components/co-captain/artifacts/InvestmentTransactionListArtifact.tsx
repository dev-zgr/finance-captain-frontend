"use client"

import { useMemo, useState } from "react"
import { History } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ArtifactRendererProps, InvestmentTransactionListPayload } from "@/lib/co-captain/types"
import { InvestmentTransactionListModal } from "./InvestmentTransactionListModal"

const fmt = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

const buildFilterSummary = (filters: {
  transactionTypes: string[] | null
  categories: string[] | null
  startDate: string | null
  endDate: string | null
  tickers: string[] | null
  q: string | null
}) => {
  const parts: string[] = []
  if (filters.transactionTypes && filters.transactionTypes.length > 0) {
    parts.push(filters.transactionTypes.join(", "))
  }
  if (filters.categories && filters.categories.length > 0) {
    parts.push(filters.categories.join(", "))
  }
  if (filters.tickers && filters.tickers.length > 0) {
    parts.push(filters.tickers.join(", "))
  }
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const end = new Date(filters.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    parts.push(`${start}–${end}`)
  } else if (filters.startDate) {
    parts.push(`from ${new Date(filters.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`)
  } else if (filters.endDate) {
    parts.push(`until ${new Date(filters.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`)
  }
  return parts.length > 0 ? parts.join(" • ") : "All transactions"
}

export function InvestmentTransactionListArtifact({ artifact }: ArtifactRendererProps<unknown>) {
  const [open, setOpen] = useState(false)

  const payload = useMemo(() => {
    const raw = (artifact.payload ?? {}) as Partial<InvestmentTransactionListPayload>
    return {
      totalCount: typeof raw.totalCount === "number" ? raw.totalCount : 0,
      displayedCount: typeof raw.displayedCount === "number" ? raw.displayedCount : 0,
      appliedFilters: raw.appliedFilters ?? {
        transactionTypes: null,
        categories: null,
        startDate: null,
        endDate: null,
        tickers: null,
        q: null,
      },
      transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
    }
  }, [artifact.payload])

  const { inflowTotal, outflowTotal } = useMemo(() => ({
    inflowTotal: payload.transactions
      .filter((t) => t.category === "DEPOSIT" || t.category === "BUY")
      .reduce((sum, t) => sum + t.amount, 0),
    outflowTotal: payload.transactions
      .filter((t) => t.category === "WITHDRAW" || t.category === "SELL")
      .reduce((sum, t) => sum + t.amount, 0),
  }), [payload.transactions])

  const filterSummary = buildFilterSummary(payload.appliedFilters)

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setOpen(true)
          }
        }}
        className="cursor-pointer transition hover:ring-1 hover:ring-primary/40"
      >
        <CardContent className="space-y-1.5 p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-1.5">
              <History className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-[11px] font-semibold">
                  {payload.displayedCount} transactions · {filterSummary}
                </p>
                <p className="truncate text-[10px] font-medium text-muted-foreground">
                  <span className="text-emerald-600 dark:text-emerald-500">↑ {fmt(inflowTotal)} inflows</span>
                  <span className="mx-1 text-muted-foreground/50">·</span>
                  <span className="text-rose-600 dark:text-rose-500">↓ {fmt(outflowTotal)} outflows</span>
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 flex items-center gap-1 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[10px] text-emerald-700 hover:bg-emerald-500/10"
            >
              <History className="size-3" />
              Investment Transactions
            </Badge>
          </div>
        </CardContent>
      </Card>

      <InvestmentTransactionListModal open={open} onOpenChange={setOpen} payload={payload} />
    </>
  )
}
