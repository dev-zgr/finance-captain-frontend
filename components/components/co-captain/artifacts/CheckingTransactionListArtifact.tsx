"use client"

import { useMemo, useState } from "react"
import { ListChecks } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ArtifactRendererProps, CheckingTransactionListPayload } from "@/lib/co-captain/types"
import { CheckingTransactionListModal } from "./CheckingTransactionListModal"

const formatDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return "All transactions"
  if (startDate && endDate) {
    const start = new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const end = new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    return `${start} - ${end}`
  }
  if (startDate) {
    return `From ${new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
  }
  return `Until ${new Date(endDate!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
}

export function CheckingTransactionListArtifact({
  artifact,
}: ArtifactRendererProps<unknown>) {
  const [open, setOpen] = useState(false)

  const payload = useMemo(() => {
    const raw = (artifact.payload ?? {}) as Partial<CheckingTransactionListPayload>

    return {
      transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
      totalCount: typeof raw.totalCount === "number" ? raw.totalCount : 0,
      dateRange: raw.dateRange,
    }
  }, [artifact.payload])

  const dateRangeText = formatDateRange(payload.dateRange?.startDate, payload.dateRange?.endDate)

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
                  {payload.totalCount} transaction{payload.totalCount !== 1 ? "s" : ""}
                </p>
                <p className="truncate text-[10px] font-medium text-muted-foreground">
                  {dateRangeText}
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
