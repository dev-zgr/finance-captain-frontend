"use client"

import { useMemo, useState } from "react"
import { TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ArtifactRendererProps, InvestmentSummaryPayload } from "@/lib/co-captain/types"
import { InvestmentSummaryModal } from "./InvestmentSummaryModal"

const fmt = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

export function InvestmentSummaryArtifact({ artifact }: ArtifactRendererProps<unknown>) {
  const [open, setOpen] = useState(false)

  const payload = useMemo(() => {
    const raw = (artifact.payload ?? {}) as Partial<InvestmentSummaryPayload>
    return {
      cashBalance: typeof raw.cashBalance === "number" ? raw.cashBalance : 0,
      totalMarketValue: typeof raw.totalMarketValue === "number" ? raw.totalMarketValue : 0,
      totalCostBasis: typeof raw.totalCostBasis === "number" ? raw.totalCostBasis : 0,
      totalUnrealizedPnl: typeof raw.totalUnrealizedPnl === "number" ? raw.totalUnrealizedPnl : 0,
      totalUnrealizedPnlPercent: typeof raw.totalUnrealizedPnlPercent === "number" ? raw.totalUnrealizedPnlPercent : 0,
      dayChangeAmount: typeof raw.dayChangeAmount === "number" ? raw.dayChangeAmount : 0,
      dayChangePercent: typeof raw.dayChangePercent === "number" ? raw.dayChangePercent : 0,
      positionsCount: typeof raw.positionsCount === "number" ? raw.positionsCount : 0,
      priceDataPartial: raw.priceDataPartial ?? false,
    }
  }, [artifact.payload])

  const daySign = payload.dayChangeAmount >= 0 ? "+" : "−"
  const dayClass =
    payload.dayChangeAmount >= 0
      ? "text-emerald-600 dark:text-emerald-500"
      : "text-rose-600 dark:text-rose-500"

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
        <CardContent className="relative space-y-1.5 p-2.5">
          <Badge
            variant="outline"
            className="absolute top-1.5 right-1.5 flex items-center gap-1 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[10px] text-emerald-700 hover:bg-emerald-500/10"
          >
            <TrendingUp className="size-3" />
            Investment Account
          </Badge>

          <div className="flex items-start gap-2">
            <div className="flex min-w-0 items-start gap-1.5">
              <TrendingUp className="mt-0.5 size-3.5 text-muted-foreground" />
              <div className="min-w-0 space-y-0">
                <p className="truncate text-[11px] font-semibold">
                  {payload.positionsCount} positions · {fmt(payload.totalMarketValue)} market value
                </p>
                <p className={`truncate text-[10px] font-medium ${dayClass}`}>
                  {daySign}{fmt(Math.abs(payload.dayChangeAmount))} ({payload.dayChangePercent >= 0 ? "+" : "−"}{Math.abs(payload.dayChangePercent).toFixed(2)}%) today
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <InvestmentSummaryModal open={open} onOpenChange={setOpen} payload={payload} />
    </>
  )
}
