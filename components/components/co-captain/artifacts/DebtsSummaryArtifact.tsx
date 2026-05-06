"use client"

import { useMemo, useState } from "react"
import { CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ArtifactRendererProps, DebtsSummaryPayload } from "@/lib/co-captain/types"
import { DebtsSummaryModal } from "./DebtsSummaryModal"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

export function DebtsSummaryArtifact({ artifact }: ArtifactRendererProps<unknown>) {
  const [open, setOpen] = useState(false)

  const payload = useMemo(() => {
    const raw = (artifact.payload ?? {}) as Partial<DebtsSummaryPayload>

    return {
      currentBalance: typeof raw.currentBalance === "number" ? raw.currentBalance : 0,
      totalDebtsThisMonth: typeof raw.totalDebtsThisMonth === "number" ? raw.totalDebtsThisMonth : 0,
      totalPaymentsThisMonth: typeof raw.totalPaymentsThisMonth === "number" ? raw.totalPaymentsThisMonth : 0,
      accountOpenedAt: typeof raw.accountOpenedAt === "string" ? raw.accountOpenedAt : "",
    }
  }, [artifact.payload])

  const net = payload.totalPaymentsThisMonth - payload.totalDebtsThisMonth
  const netPrefix = net >= 0 ? "+" : ""
  const netClass = net >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"

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
            className="absolute top-1.5 right-1.5 flex items-center gap-1 border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-700 hover:bg-amber-500/10"
          >
            <CreditCard className="size-3" />
            Debts Account
          </Badge>

          <div className="flex items-start gap-2">
            <div className="flex min-w-0 items-start gap-1.5">
              <CreditCard className="mt-0.5 size-3.5 text-muted-foreground" />
              <div className="min-w-0 space-y-0">
                <p className="truncate text-[11px] font-semibold">
                  Liabilities: {formatCurrency(payload.currentBalance)}
                </p>
                <p className={`truncate text-[10px] font-medium ${netClass}`}>
                  {netPrefix}
                  {formatCurrency(net)} net this month
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DebtsSummaryModal open={open} onOpenChange={setOpen} payload={payload} />
    </>
  )
}
