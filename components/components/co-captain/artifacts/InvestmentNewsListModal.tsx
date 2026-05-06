"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, InboxIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AiOverviewCard } from "@/components/components/investment-account/news/ai-overview-card"
import { NewsListItem } from "@/components/components/investment-account/news/news-list-item"
import type { InvestmentNewsListPayload } from "@/lib/co-captain/types"

type SortDirection = "DESC" | "ASC"

const DEFAULT_SORT_DIRECTION: SortDirection = "DESC"

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  const now = new Date()
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (secondsAgo < 60) return "just now"
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`
  return date.toLocaleDateString()
}

export interface InvestmentNewsListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payload: Partial<InvestmentNewsListPayload>
}

export function InvestmentNewsListModal({ open, onOpenChange, payload }: InvestmentNewsListModalProps) {
  const [tickerFilter, setTickerFilter] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_SORT_DIRECTION)

  const items = useMemo(() => payload.items ?? [], [payload.items])
  const overallSummary = payload.overallSummary ?? null
  const generatedAt = payload.generatedAt ?? null
  const totalCount = payload.totalCount ?? 0
  const displayedCount = payload.displayedCount ?? items.length
  const hasMoreResults = totalCount > displayedCount

  const availableTickers = useMemo(() => {
    const seen = new Set<string>()
    for (const item of items) {
      if (item.relevantTicker) seen.add(item.relevantTicker)
    }
    return [...seen].sort()
  }, [items])

  const showTickerFilter = availableTickers.length > 0

  const filteredAndSorted = useMemo(() => {
    let result = [...items]
    if (tickerFilter !== null) {
      result = result.filter((item) => item.relevantTicker === tickerFilter)
    }
    result.sort((a, b) => {
      const aTime = new Date(a.publishedAt).getTime()
      const bTime = new Date(b.publishedAt).getTime()
      return sortDirection === "DESC" ? bTime - aTime : aTime - bTime
    })
    return result
  }, [items, tickerFilter, sortDirection])

  const showReset = tickerFilter !== null || sortDirection !== DEFAULT_SORT_DIRECTION
  const relativeTime = formatRelativeTime(generatedAt)

  const storyCount = filteredAndSorted.length

  const handleReset = () => {
    setTickerFilter(null)
    setSortDirection(DEFAULT_SORT_DIRECTION)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Investment News Brief</DialogTitle>
          {relativeTime && (
            <DialogDescription>Generated {relativeTime}</DialogDescription>
          )}

          {items.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {showTickerFilter && (
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  value={tickerFilter ?? ""}
                  onValueChange={(v) => setTickerFilter(v === "" ? null : v)}
                >
                  <ToggleGroupItem value="">All</ToggleGroupItem>
                  {availableTickers.map((ticker) => (
                    <ToggleGroupItem key={ticker} value={ticker}>
                      {ticker}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}

              <Select
                value={sortDirection}
                onValueChange={(v) => setSortDirection(v as SortDirection)}
              >
                <SelectTrigger size="sm" className="w-[140px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value="DESC">Newest first</SelectItem>
                    <SelectItem value="ASC">Oldest first</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              {showReset && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <X data-icon="inline-start" />
                  Reset
                </Button>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="px-6 py-4 space-y-4">
            {(overallSummary || generatedAt) && (
              <AiOverviewCard
                summary={overallSummary}
                generatedAt={generatedAt}
                summaryMaxLines={6}
              />
            )}

            {(overallSummary || generatedAt) && filteredAndSorted.length > 0 && (
              <Separator />
            )}

            {filteredAndSorted.length > 0 ? (
              <ul className="space-y-0">
                {filteredAndSorted.map((item) => (
                  <NewsListItem key={item.link} item={item} />
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <InboxIcon className="size-10 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">No stories found.</p>
                {tickerFilter && (
                  <p className="text-sm text-muted-foreground">
                    Try selecting a different ticker or &quot;All&quot;.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">
            {storyCount === 0
              ? "No stories"
              : `${storyCount} ${storyCount === 1 ? "story" : "stories"}${hasMoreResults ? ` (${totalCount} total)` : ""}`}
          </p>

          <Button variant="outline" size="sm" asChild>
            <Link href="/investment-account/news">
              View all news
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
