"use client"

import { useMemo, useState } from "react"
import { TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ArtifactRendererProps, InvestmentPositionListPayload } from "@/lib/co-captain/types"
import { InvestmentPositionListModal } from "./InvestmentPositionListModal"

const fmt = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

const buildFilterSummary = (filters: {
  gainLossFilter: "ALL" | "GAINERS" | "LOSERS" | null
  q: string | null
}) => {
  const parts: string[] = []
  if (filters.gainLossFilter && filters.gainLossFilter !== "ALL") {
    parts.push(filters.gainLossFilter === "GAINERS" ? "Gainers" : "Losers")
  }
  if (filters.q) parts.push(`"${filters.q}"`)
  return parts.length > 0 ? parts.join(" • ") : "All positions"
}

export function InvestmentPositionListArtifact({ artifact }: ArtifactRendererProps<unknown>) {
  const [open, setOpen] = useState(false)

  const payload = useMemo(() => {
    const raw = (artifact.payload ?? {}) as Partial<InvestmentPositionListPayload>
    return {
      totalCount: typeof raw.totalCount === "number" ? raw.totalCount : 0,
      displayedCount: typeof raw.displayedCount === "number" ? raw.displayedCount : (Array.isArray(raw.positions) ? raw.positions.length : 0),
      priceDataPartial: raw.priceDataPartial ?? false,
      appliedFilters: raw.appliedFilters ?? { gainLossFilter: null, q: null },
      positions: Array.isArray(raw.positions) ? raw.positions : [],
    }
  }, [artifact.payload])

  const { totalMarketValue, totalUnrealizedPnl } = useMemo(() => ({
    totalMarketValue: payload.positions.reduce((sum, p) => sum + p.marketValue, 0),
    totalUnrealizedPnl: payload.positions.reduce((sum, p) => sum + p.unrealizedPnl, 0),
  }), [payload.positions])

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
              <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-[11px] font-semibold">
                  {payload.displayedCount} positions · {filterSummary}
                </p>
                <p className="truncate text-[10px] font-medium text-muted-foreground">
                  <span className="text-foreground">{fmt(totalMarketValue)} market value</span>
                  <span className="mx-1 text-muted-foreground/50">·</span>
                  <span className={totalUnrealizedPnl >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"}>
                    {totalUnrealizedPnl >= 0 ? "+" : "−"}{fmt(Math.abs(totalUnrealizedPnl))} unrealized P/L
                  </span>
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 flex items-center gap-1 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[10px] text-emerald-700 hover:bg-emerald-500/10"
            >
              <TrendingUp className="size-3" />
              Investment Positions
            </Badge>
          </div>
        </CardContent>
      </Card>

      <InvestmentPositionListModal open={open} onOpenChange={setOpen} payload={payload} />
    </>
  )
}
