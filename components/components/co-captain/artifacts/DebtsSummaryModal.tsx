"use client"

import Link from "next/link"
import { format, parseISO } from "date-fns"
import { Calendar, TrendingDown, TrendingUp } from "lucide-react"
import { RiArrowRightLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { DebtsSummaryPayload } from "@/lib/co-captain/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  payload: DebtsSummaryPayload
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

const formatDate = (value: string) => {
  if (!value) return "—"
  try {
    return format(parseISO(value), "MMM d, yyyy")
  } catch {
    return "—"
  }
}

export function DebtsSummaryModal({ open, onOpenChange, payload }: Props) {
  const net = payload.totalPaymentsThisMonth - payload.totalDebtsThisMonth
  const netClass = net >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Debts Summary</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Liabilities</p>
            <p
              className={`text-2xl font-semibold tracking-tight tabular-nums ${
                payload.currentBalance < 0 ? "text-red-600 dark:text-red-500" : ""
              }`}
            >
              {formatCurrency(payload.currentBalance)}
            </p>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="size-4 text-red-600 dark:text-red-500" />
                Debts this month
              </span>
              <span className="text-sm font-medium tabular-nums">{formatCurrency(payload.totalDebtsThisMonth)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingDown className="size-4 text-green-600 dark:text-green-500" />
                Payments this month
              </span>
              <span className="text-sm font-medium tabular-nums">{formatCurrency(payload.totalPaymentsThisMonth)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Net this month</span>
              <span className={`text-sm font-medium tabular-nums ${netClass}`}>{formatCurrency(net)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4 text-muted-foreground" />
              Account Opened
            </span>
            <span className="text-sm font-medium tabular-nums">{formatDate(payload.accountOpenedAt)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button asChild onClick={() => onOpenChange(false)}>
            <Link href="/debt-account" className="inline-flex items-center gap-1.5">
              Go to debt account
              <RiArrowRightLine className="size-4" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
