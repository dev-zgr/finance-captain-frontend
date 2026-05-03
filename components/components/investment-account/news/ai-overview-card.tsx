"use client"

import { Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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
}

export function AiOverviewCard({
  summary,
  generatedAt,
  isLoading = false,
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

  return (
    <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-purple-950/20 border-purple-200/50 dark:border-purple-900/30 animate-gradient">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="motion-safe:animate-pulse flex-shrink-0">
            <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 space-y-2">
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
            {summary ? (
              <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
                {summary}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Your AI summary is being generated…
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
