"use client"

import Link from "next/link"
import { BarChart3, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { RiArrowRightLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { InvestmentSummaryPayload } from "@/lib/co-captain/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  payload: InvestmentSummaryPayload
}

const fmt = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

const getPLColor = (value: number) => {
  if (value > 0) return "text-emerald-600 dark:text-emerald-500"
  if (value < 0) return "text-rose-600 dark:text-rose-500"
  return "text-muted-foreground"
}

export function InvestmentSummaryModal({ open, onOpenChange, payload }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Investment Summary</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Market Value</p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {fmt(payload.totalMarketValue)}
            </p>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="size-4 text-muted-foreground" />
                Cash Balance
              </span>
              <span className="text-sm font-medium tabular-nums">
                {fmt(payload.cashBalance)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="size-4 text-muted-foreground" />
                Total Cost Basis
              </span>
              <span className="text-sm font-medium tabular-nums">
                {fmt(payload.totalCostBasis)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp
                  className={`size-4 ${getPLColor(payload.totalUnrealizedPnl)}`}
                />
                Unrealized P/L
              </span>
              <span className={`text-sm font-medium tabular-nums ${getPLColor(payload.totalUnrealizedPnl)}`}>
                {fmt(payload.totalUnrealizedPnl)} ({payload.totalUnrealizedPnlPercent.toFixed(2)}%)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingDown
                  className={`size-4 ${getPLColor(payload.dayChangeAmount)}`}
                />
                Day Change
              </span>
              <span className={`text-sm font-medium tabular-nums ${getPLColor(payload.dayChangeAmount)}`}>
                {fmt(payload.dayChangeAmount)} ({payload.dayChangePercent.toFixed(2)}%)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="size-4 text-muted-foreground" />
                Open Positions
              </span>
              <span className="text-sm font-medium tabular-nums">
                {payload.positionsCount}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button asChild onClick={() => onOpenChange(false)}>
            <Link href="/investment-account/overview" className="inline-flex items-center gap-1.5">
              Go to investment account
              <RiArrowRightLine className="size-4" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
