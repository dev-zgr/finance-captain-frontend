"use client"

import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { LinkedTransferDirection } from "@/components/components/investment-account/transactions/LinkedTransferStep"

type ConfirmationStepProps = {
  direction: LinkedTransferDirection
  amount: number
  description: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)

export function ConfirmationStep({
  direction,
  amount,
  description,
}: ConfirmationStepProps) {
  const isDeposit = direction === "CHECKING_TO_INVESTMENT"

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {formatCurrency(amount)}
            </p>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="flex items-center gap-2 text-sm font-medium tabular-nums">
                {format(new Date(), "MMM d, yyyy")}
                <Badge variant="outline">Today</Badge>
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Description</span>
              <span className="truncate text-sm font-medium">
                {description.trim() || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Linked checking transaction
              </span>
              <span className="text-sm font-medium tabular-nums">
                {isDeposit
                  ? `- ${formatCurrency(amount)} from checking · TRANSFERS`
                  : `+ ${formatCurrency(amount)} to checking · TRANSFERS`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Today&apos;s date will be assigned by the server.
      </p>
    </div>
  )
}
