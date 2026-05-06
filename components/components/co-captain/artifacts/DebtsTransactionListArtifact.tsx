"use client"

import { useMemo, useState } from "react"
import { CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ArtifactRendererProps, DebtsTransactionListPayload } from "@/lib/co-captain/types"
import { DebtsTransactionListModal } from "./DebtsTransactionListModal"

const fmt = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

const buildFilterSummary = (filters: {
  transactionType: string | null
  category: string | null
  startDate: string | null
  endDate: string | null
}) => {
  const parts: string[] = []
  if (filters.transactionType) parts.push(filters.transactionType)
  if (filters.category) parts.push(filters.category)
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

export function DebtsTransactionListArtifact({ artifact }: ArtifactRendererProps<unknown>) {
  const [open, setOpen] = useState(false)

  const payload = useMemo(() => {
    const raw = (artifact.payload ?? {}) as Partial<DebtsTransactionListPayload>
    return {
      totalCount: typeof raw.totalCount === "number" ? raw.totalCount : 0,
      displayedCount: typeof raw.displayedCount === "number" ? raw.displayedCount : 0,
      appliedFilters: raw.appliedFilters ?? { transactionType: null, category: null, startDate: null, endDate: null },
      transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
    }
  }, [artifact.payload])

  const { debtTotal, paymentTotal } = useMemo(() => ({
    debtTotal: payload.transactions
      .filter((t) => t.transactionType === "DEBT")
      .reduce((sum, t) => sum + t.amount, 0),
    paymentTotal: payload.transactions
      .filter((t) => t.transactionType === "PAYMENT")
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
              <CreditCard className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-[11px] font-semibold">
                  {payload.displayedCount} transactions · {filterSummary}
                </p>
                <p className="truncate text-[10px] font-medium text-muted-foreground">
                  <span className="text-red-600 dark:text-red-500">↓ {fmt(debtTotal)} debt</span>
                  <span className="mx-1 text-muted-foreground/50">·</span>
                  <span className="text-emerald-600 dark:text-emerald-500">↑ {fmt(paymentTotal)} payments</span>
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 flex items-center gap-1 border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-700 hover:bg-amber-500/10"
            >
              <CreditCard className="size-3" />
              Debt Transactions
            </Badge>
          </div>
        </CardContent>
      </Card>

      <DebtsTransactionListModal open={open} onOpenChange={setOpen} payload={payload} />
    </>
  )
}
