"use client"

import { Sparkles } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return ""

  const date = new Date(dateString)
  const now = new Date()
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (secondsAgo < 60) return "just now"
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`

  return date.toLocaleDateString()
}

interface AiOverviewCardProps {
  summary: string | null
  generatedAt: string | null
  isLoading?: boolean
  ctaLabel?: string
  ctaHref?: string
  ctaPlacement?: "header-right" | "bottom-center"
  summaryMaxLines?: number
  className?: string
  truncateToContainer?: boolean
}

export function AiOverviewCard({
  summary,
  generatedAt,
  isLoading = false,
  ctaLabel,
  ctaHref,
  ctaPlacement = "header-right",
  summaryMaxLines,
  className,
  truncateToContainer = false,
}: AiOverviewCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-purple-950/20 animate-gradient">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const relativeTime = formatRelativeTime(generatedAt)
  const summaryClampStyle =
    typeof summaryMaxLines === "number"
      ? {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical" as const,
          WebkitLineClamp: summaryMaxLines,
          overflow: "hidden",
        }
      : undefined

  return (
    <Card
      className={`bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-purple-950/20 border-purple-200/50 dark:border-purple-900/30 animate-gradient overflow-hidden flex flex-col ${className ?? ""}`}
    >
      <CardContent className="pt-6 pb-6 h-full flex-1 min-h-0">
        <div className="flex items-start gap-4 h-full min-h-0">
          <div className="motion-safe:animate-pulse flex-shrink-0">
            <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 space-y-2 h-full min-h-0 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                  Market Brief AI Summary
                </h3>
                {relativeTime && (
                  <span className="text-xs text-muted-foreground">
                    generated {relativeTime}
                  </span>
                )}
              </div>
              {ctaLabel && ctaHref && ctaPlacement === "header-right" && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-purple-700 hover:bg-transparent hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-100"
                >
                  <Link href={ctaHref}>
                    {ctaLabel}
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              )}
            </div>
            <div className={truncateToContainer ? "min-h-0 flex-1 overflow-hidden" : ""}>
              {summary ? (
                <p
                  className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed"
                  style={summaryClampStyle}
                >
                  {summary}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Your AI summary is being generated…
                </p>
              )}
            </div>
            {ctaLabel && ctaHref && ctaPlacement === "bottom-center" && (
              <div className="pt-1 text-center flex-shrink-0">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-purple-700 hover:bg-transparent hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-100"
                >
                  <Link href={ctaHref}>
                    {ctaLabel}
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
