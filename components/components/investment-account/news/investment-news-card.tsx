"use client"

import { AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { NewsItemDTO } from "@/lib/investment-account/types"
import { AiOverviewCard } from "./ai-overview-card"
import { NewsListItem } from "./news-list-item"

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Never"

  const date = new Date(dateString)
  const now = new Date()
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (secondsAgo < 60) return "just now"
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`

  return date.toLocaleDateString()
}

interface InvestmentNewsCardProps {
  status: "READY" | "PENDING" | "ERROR"
  items: NewsItemDTO[]
  overallSummary: string | null
  generatedAt: string | null
  isLoading: boolean
  onRefresh: () => Promise<void>
  refreshDisabled: boolean
  refreshTooltip: string | null
  error: string | null
  currentPage: number
  onPageChange: (page: number) => void
  totalPages: number
}

export function InvestmentNewsCard({
  status,
  items,
  overallSummary,
  generatedAt,
  isLoading,
  onRefresh,
  refreshDisabled,
  refreshTooltip,
  error,
  currentPage,
  onPageChange,
  totalPages,
}: InvestmentNewsCardProps) {
  const lastUpdated = formatRelativeTime(generatedAt)
  const isEmpty = items.length === 0 && status === "READY"

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Market Brief</CardTitle>
          <CardDescription>
            5 stories curated for your portfolio.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">
              updated <span className="font-medium">{lastUpdated}</span>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={refreshDisabled}
                  className="gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              {refreshTooltip && <TooltipContent>{refreshTooltip}</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {status === "PENDING" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              We&apos;re generating your latest news. This may take a minute. We&apos;ll
              show you the previous batch in the meantime.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AiOverviewCard
          summary={overallSummary}
          generatedAt={generatedAt}
          isLoading={isLoading}
        />

        <Separator />

        {isEmpty ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No news yet</EmptyTitle>
              <EmptyDescription>Try refreshing to get started.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="space-y-0">
            {isLoading ? (
              <>
                <NewsListItem isLoading />
                <NewsListItem isLoading />
                <NewsListItem isLoading />
                <NewsListItem isLoading />
                <NewsListItem isLoading />
              </>
            ) : (
              items.map((item) => <NewsListItem key={item.link} item={item} />)
            )}
          </ul>
        )}

        {!isEmpty && totalPages > 1 && (
          <>
            <Separator />
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(0)}
                disabled={currentPage === 0}
              >
                Page 1
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage >= totalPages - 1}
              >
                Page 2
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
