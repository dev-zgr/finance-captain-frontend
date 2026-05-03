"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { AlertCircle, ArrowRight, Inbox } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  extractInvestmentPositionsContent,
  getInvestmentPositionsWithoutBody,
} from "@/lib/investment-account/api"
import type { InvestmentApiErrorResponse, PositionEnrichedDTO } from "@/lib/investment-account/types"
import type { RootState } from "@/lib/store"
import { cn } from "@/lib/utils"

const SKELETON_ROWS = 5
const PREVIEW_LIMIT = 5

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function formatSignedCurrency(value: number): string {
  const sign = value >= 0 ? "+" : "−"
  return `${sign}${currencyFormatter.format(Math.abs(value))}`
}

function formatSignedPercent(value: number): string {
  const sign = value >= 0 ? "+" : "−"
  return `${sign}${Math.abs(value).toFixed(2)}%`
}

function getPLColor(value: number): string {
  if (value > 0) {
    return "text-emerald-600"
  }
  if (value < 0) {
    return "text-rose-600"
  }
  return "text-muted-foreground"
}

function getErrorMessage(status: number, payload?: InvestmentApiErrorResponse): string {
  if (status === 400) {
    return payload?.message ?? "Invalid request parameters."
  }

  if (status === 401) {
    return payload?.message ?? "Your session has expired. Please log in again."
  }

  if (status === 404) {
    return payload?.message ?? "Positions not found."
  }

  if (status === 500) {
    return payload?.message ?? "Could not load positions. Please try again."
  }

  return payload?.message ?? "Could not load positions. Please try again."
}

export function InvestmentPositionsPreviewCard() {
  const router = useRouter()
  const token = useSelector((state: RootState) => state.auth.content?.token ?? "")
  const abortControllerRef = useRef<AbortController | null>(null)

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [positions, setPositions] = useState<PositionEnrichedDTO[]>([])

  const fetchPositions = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await getInvestmentPositionsWithoutBody(token, controller.signal)

      if (controller.signal.aborted) {
        return
      }

      if (response.status === 200) {
        const payload = extractInvestmentPositionsContent(response.data)
        setPositions(payload?.positions ?? [])
        return
      }

      const body = response.data as InvestmentApiErrorResponse
      setPositions([])
      setErrorMessage(getErrorMessage(response.status, body))
    } catch {
      if (controller.signal.aborted) {
        return
      }

      setPositions([])
      setErrorMessage("Could not load positions. Please try again.")
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false)
      }
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setPositions([])
      return
    }

    void fetchPositions()
  }, [fetchPositions, token])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const displayRows = useMemo(() => positions.slice(0, PREVIEW_LIMIT), [positions])

  return (
    <Card className="col-span-8 max-lg:col-span-12">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Positions</CardTitle>
            <CardDescription>Your top holdings by market value.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/investment-account/portfolio">
              See Positions
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Table className="w-full table-auto">
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Last Price</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead>Total G/L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <TableRow key={`positions-preview-skeleton-${index}`}>
                  {Array.from({ length: 4 }, (_, cellIndex) => (
                    <TableCell key={`positions-preview-skeleton-cell-${index}-${cellIndex}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : errorMessage ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={() => void fetchPositions()}>
              Retry
            </Button>
          </div>
        ) : (
          <Table className="w-full table-auto">
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Last Price</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead>Total G/L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10">
                    <Empty className="border-0 p-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Inbox />
                        </EmptyMedia>
                        <EmptyTitle>No open positions yet</EmptyTitle>
                        <EmptyDescription>
                          Start trading to build your portfolio.
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button asChild>
                          <Link href="/investment-account/trade">Start trading</Link>
                        </Button>
                      </EmptyContent>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                displayRows.map((position) => {
                  const positionId = String(position.id)
                  return (
                    <TableRow
                      key={position.id}
                      tabIndex={0}
                      role="button"
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/investment-account/portfolio/${positionId}`)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          router.push(`/investment-account/portfolio/${positionId}`)
                        }
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarImage
                              src={position.logoUrl ?? undefined}
                              alt={`${position.ticker} logo`}
                            />
                            <AvatarFallback>{position.ticker.slice(0, 1)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium">{position.ticker}</p>
                            <p className="max-w-[140px] truncate text-xs text-muted-foreground lg:max-w-[180px]">
                              {position.companyName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="tabular-nums">
                          {currencyFormatter.format(position.currentPrice)}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <Badge
                          variant="outline"
                          className={cn(
                            "w-fit font-normal",
                            position.dayChange > 0
                              ? "border-lime-500/30 bg-lime-500/10 text-lime-700 hover:bg-lime-500/10"
                              : position.dayChange < 0
                                ? "border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/10"
                                : "border-muted-foreground/30 bg-muted text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {formatSignedCurrency(position.dayChange)} (
                          {formatSignedPercent(position.dayChangePercent)})
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={cn("font-medium tabular-nums", getPLColor(position.unrealizedPnl))}>
                          {formatSignedCurrency(position.unrealizedPnl)}
                        </div>
                        <div className={cn("text-xs tabular-nums", getPLColor(position.unrealizedPnlPercent))}>
                          {formatSignedPercent(position.unrealizedPnlPercent)}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
