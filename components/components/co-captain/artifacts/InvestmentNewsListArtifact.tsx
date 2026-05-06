"use client"

import { useMemo, useState } from "react"
import { Newspaper } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ArtifactRendererProps, InvestmentNewsListPayload } from "@/lib/co-captain/types"
import { InvestmentNewsListModal } from "./InvestmentNewsListModal"

type NewsItem = InvestmentNewsListPayload["items"][number]

const buildTickerSummary = (items: NewsItem[]): string => {
  const tickers = [...new Set(items.map((i) => i.relevantTicker).filter((t): t is string => t !== null))]
  if (tickers.length === 0) return "your portfolio"
  if (tickers.length <= 3) return tickers.join(", ")
  return `${tickers.slice(0, 2).join(", ")} + ${tickers.length - 2} more`
}

export function InvestmentNewsListArtifact({ artifact }: ArtifactRendererProps<unknown>) {
  const [open, setOpen] = useState(false)

  const payload = useMemo(() => {
    const raw = (artifact.payload ?? {}) as Partial<InvestmentNewsListPayload>
    return {
      totalCount: typeof raw.totalCount === "number" ? raw.totalCount : 0,
      displayedCount: typeof raw.displayedCount === "number" ? raw.displayedCount : (Array.isArray(raw.items) ? raw.items.length : 0),
      overallSummary: raw.overallSummary ?? null,
      generatedAt: raw.generatedAt ?? null,
      items: Array.isArray(raw.items) ? raw.items : [],
    }
  }, [artifact.payload])

  const tickerSummary = useMemo(() => buildTickerSummary(payload.items), [payload.items])
  const firstHeadline = payload.items[0]?.title ?? null

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
              <Newspaper className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-[11px] font-semibold">
                  {payload.displayedCount} {payload.displayedCount === 1 ? "story" : "stories"} · {tickerSummary}
                </p>
                {firstHeadline && (
                  <p className="truncate text-[10px] font-medium text-muted-foreground">
                    {firstHeadline} ...
                  </p>
                )}
              </div>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 flex items-center gap-1 border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-700 hover:bg-amber-500/10"
            >
              <Newspaper className="size-3" />
              Investment News
            </Badge>
          </div>
        </CardContent>
      </Card>

      <InvestmentNewsListModal open={open} onOpenChange={setOpen} payload={payload} />
    </>
  )
}
