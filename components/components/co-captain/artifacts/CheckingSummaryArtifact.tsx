"use client"

import { useMemo, useState } from "react"
import { Wallet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ArtifactRendererProps, CheckingSummaryPayload } from "@/lib/co-captain/types"
import { CheckingSummaryModal } from "./CheckingSummaryModal"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

const netTextClass = (value: number) =>
  value >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"

export function CheckingSummaryArtifact({ artifact }: ArtifactRendererProps<unknown>) {
  const [open, setOpen] = useState(false)

  const payload = useMemo(() => {
    const raw = (artifact.payload ?? {}) as Partial<CheckingSummaryPayload>

    return {
      balance: typeof raw.balance === "number" ? raw.balance : 0,
      monthlyIncome: typeof raw.monthlyIncome === "number" ? raw.monthlyIncome : 0,
      monthlyExpenses: typeof raw.monthlyExpenses === "number" ? raw.monthlyExpenses : 0,
      monthlyNet: typeof raw.monthlyNet === "number" ? raw.monthlyNet : 0,
      accountOpenedAt: typeof raw.accountOpenedAt === "string" ? raw.accountOpenedAt : "",
    }
  }, [artifact.payload])

  const netPrefix = payload.monthlyNet >= 0 ? "+" : ""

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
            <Wallet className="size-3" />
            Checking Account
          </Badge>

          <div className="flex items-start gap-2">
            <div className="flex min-w-0 items-start gap-1.5">
              <Wallet className="mt-0.5 size-3.5 text-muted-foreground" />
              <div className="min-w-0 space-y-0">
                <p className="truncate text-[11px] font-semibold">
                  Balance: {formatCurrency(payload.balance)}
                </p>
                <p className={`truncate text-[10px] font-medium ${netTextClass(payload.monthlyNet)}`}>
                  {netPrefix}
                  {formatCurrency(payload.monthlyNet)} net this month
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CheckingSummaryModal open={open} onOpenChange={setOpen} payload={payload} />
    </>
  )
}
