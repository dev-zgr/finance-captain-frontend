"use client"

import { RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { formatCurrency } from "@/lib/utils"

type Props = {
  ticker: string
  companyName: string
  currentPrice: number | null
  percentChange: number | null
  isLoading: boolean
  onRefresh: () => void
  disabled?: boolean
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "−"
  return `${sign}${Math.abs(value).toFixed(2)}%`
}

export function StockPricePreview({
  ticker,
  companyName,
  currentPrice,
  percentChange,
  isLoading,
  onRefresh,
  disabled = false,
}: Props) {
  const changeClass =
    percentChange === null
      ? "text-muted-foreground"
      : percentChange >= 0
        ? "text-emerald-600 dark:text-emerald-500"
        : "text-rose-600 dark:text-rose-500"

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">
              <span className="font-mono">{ticker || "—"}</span>
              {companyName ? <span className="ml-1.5 text-muted-foreground">{companyName}</span> : null}
            </p>
            <p className="text-xs text-muted-foreground">
              Current price:{" "}
              <span className="font-medium text-foreground">
                {currentPrice === null ? "—" : formatCurrency(currentPrice)}
              </span>
              {percentChange !== null ? (
                <span className={`ml-1 ${changeClass}`}>({formatPercent(percentChange)})</span>
              ) : null}
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[11px]"
            onClick={onRefresh}
            disabled={disabled || isLoading}
          >
            {isLoading ? <Spinner className="size-3.5" /> : <RotateCw className="size-3.5" />}
            Refresh price
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
