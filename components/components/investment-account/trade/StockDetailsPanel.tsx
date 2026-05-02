"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { StockDetailsDTO } from "@/lib/investment-account/types"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { IndustryBadge } from "./IndustryBadge"
import { TrendingUp, TrendingDown } from "lucide-react"

type StockDetailsPanelProps = {
  stockDetails: StockDetailsDTO | null
  isLoading?: boolean
}

export function StockDetailsPanel({
  stockDetails,
  isLoading = false,
}: StockDetailsPanelProps) {
  if (!stockDetails && !isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Select a ticker to view details</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!stockDetails) {
    return null
  }

  // Get values with defensive defaults
  const companyName = stockDetails.companyName || stockDetails.ticker || "Unknown"
  const ticker = stockDetails.ticker || "N/A"
  const currentPrice = stockDetails.currentPrice || 0
  const priceChange = stockDetails.change ?? stockDetails.dayChange ?? 0
  const percentChange = stockDetails.percentChange ?? stockDetails.dayChangePercentage ?? 0
  const isPositive = priceChange >= 0
  const logoUrl = stockDetails.logoUrl ?? stockDetails.logo
  const websiteUrl = stockDetails.weburl ?? stockDetails.website

  // Get OHLC values - prefer new field names, fall back to old ones
  const openPrice = stockDetails.openPrice ?? stockDetails.open
  const highPrice = stockDetails.highPrice ?? stockDetails.high
  const lowPrice = stockDetails.lowPrice ?? stockDetails.low
  const prevClose = stockDetails.previousClose

  // Check if we have valid data
  if (!ticker || currentPrice === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="font-medium">⚠️ No Data Available</p>
            <p className="text-sm text-muted-foreground">Unable to fetch stock details. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-fit">
      <CardContent className="pt-6 space-y-4">
        {/* Header: Logo, Company Name, Industry */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div>
                <h2 className="text-2xl font-bold">{companyName}</h2>
                <p className="text-sm text-muted-foreground">{ticker}</p>
              </div>
              {stockDetails.industry && (
                <IndustryBadge industry={stockDetails.industry} />
              )}
            </div>
            {logoUrl && (
              <img
                src={logoUrl}
                alt={companyName}
                className="h-16 w-16 rounded object-contain flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            )}
          </div>
        </div>

        <Separator />

        {/* Price Section: Large Price + Colored Change Badge */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-4xl font-bold">
              {formatCurrency(currentPrice)}
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm ${
                isPositive
                  ? "bg-green-500/15 text-green-700 border border-green-500/30"
                  : "bg-red-500/15 text-red-700 border border-red-500/30"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {formatCurrency(priceChange)} ({formatPercent(percentChange)})
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* OHLC Data Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {openPrice !== null && openPrice !== undefined && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground font-medium">Open</p>
              <p className="text-base font-semibold">{formatCurrency(openPrice)}</p>
            </div>
          )}
          {highPrice !== null && highPrice !== undefined && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground font-medium">High</p>
              <p className="text-base font-semibold">{formatCurrency(highPrice)}</p>
            </div>
          )}
          {lowPrice !== null && lowPrice !== undefined && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground font-medium">Low</p>
              <p className="text-base font-semibold">{formatCurrency(lowPrice)}</p>
            </div>
          )}
          {prevClose !== null && prevClose !== undefined && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground font-medium">Prev Close</p>
              <p className="text-base font-semibold">{formatCurrency(prevClose)}</p>
            </div>
          )}
        </div>

        {/* Company Info */}
        <div className="space-y-3 text-sm">
          {stockDetails.exchange && (
            <div className="flex justify-between items-center p-2">
              <p className="text-muted-foreground">Exchange</p>
              <p className="font-medium">{stockDetails.exchange}</p>
            </div>
          )}
          {stockDetails.marketCap && (
            <div className="flex justify-between items-center p-2">
              <p className="text-muted-foreground">Market Cap</p>
              <p className="font-medium">{formatCurrency(stockDetails.marketCap)}</p>
            </div>
          )}
          {stockDetails.ipoDate && (
            <div className="flex justify-between items-center p-2">
              <p className="text-muted-foreground">IPO Date</p>
              <p className="font-medium">
                {new Date(stockDetails.ipoDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Website Link */}
        {websiteUrl && (
          <>
            <Separator />
            <div>
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Visit Website →
              </a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
