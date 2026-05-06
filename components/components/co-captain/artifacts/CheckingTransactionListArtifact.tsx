"use client"

import { useMemo, useState } from "react"
import { ListChecks } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ArtifactRendererProps, CheckingTransactionListPayload } from "@/lib/co-captain/types"
import { CheckingTransactionListModal } from "./CheckingTransactionListModal"

const buildFilterSummary = (filters: {
  transactionType: string | null
  category: string | null
  startDate: string | null
  endDate: string | null
}) => {
  const parts: string[] = []

  if (filters.transactionType) {
    parts.push(filters.transactionType)
  }

  if (filters.category) {
    parts.push(filters.category)
  }

  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const end = new Date(filters.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    parts.push(`${start}–${end}`)
  } else if (filters.startDate) {
    const start = new Date(filters.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    parts.push(`from ${start}`)
  } else if (filters.endDate) {
    const end = new Date(filters.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    parts.push(`until ${end}`)
  }

  return parts.length > 0 ? parts.join(" • ") : "All transactions"
}

export function CheckingTransactionListArtifact({
  artifact,
}: ArtifactRendererProps<unknown>) {
  const [open, setOpen] = useState(false)

  const payload = useMemo(() => {
    const raw = (artifact.payload ?? {}) as Partial<CheckingTransactionListPayload>

    return {
      totalCount: typeof raw.totalCount === "number" ? raw.totalCount : 0,
      displayedCount: typeof raw.displayedCount === "number" ? raw.displayedCount : 0,
      appliedFilters: raw.appliedFilters ?? {
        transactionType: null,
        category: null,
        startDate: null,
        endDate: null,
      },
      transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
    }
  }, [artifact.payload])

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
        <CardContent className="relative space-y-1.5 p-2.5">
          <Badge
            variant="outline"
            className="absolute top-1.5 right-1.5 flex items-center gap-1 border-blue-500/30 bg-blue-500/10 px-1.5 py-0 text-[10px] text-blue-700 hover:bg-blue-500/10"
          >
            <ListChecks className="size-3" />
            Checking Transactions
          </Badge>

          <div className="flex items-start gap-2 pr-14">
            <div className="flex min-w-0 items-start gap-1.5">
              <ListChecks className="mt-0.5 size-3.5 text-muted-foreground" />
              <div className="min-w-0 space-y-0">
                <p className="truncate text-[11px] font-semibold">
                  {payload.displayedCount} transaction{payload.displayedCount !== 1 ? "s" : ""}
                </p>
                <p className="truncate text-[10px] font-medium text-muted-foreground">
                  {filterSummary}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CheckingTransactionListModal open={open} onOpenChange={setOpen} payload={payload} />
    </>
  )
}
