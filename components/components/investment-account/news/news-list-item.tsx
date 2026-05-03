"use client"

import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { NewsItemDTO } from "@/lib/investment-account/types"

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (secondsAgo < 60) return "just now"
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`

  return date.toLocaleDateString()
}

interface NewsListItemProps {
  item?: NewsItemDTO
  isLoading?: boolean
}

export function NewsListItem({ item, isLoading = false }: NewsListItemProps) {
  if (isLoading || !item) {
    return (
      <li className="flex gap-4 border-b py-4 last:border-b-0">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-12 w-full" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </li>
    )
  }

  const publishedTime = formatRelativeTime(item.publishedAt)

  return (
    <li className="flex gap-4 border-b py-4 last:border-b-0">
      <div className="flex-1 space-y-2">
        <h3 className="font-semibold leading-snug line-clamp-2">
          {item.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {item.aiSummary}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-2">
          <span>{item.sourceName}</span>
          <span>·</span>
          <span>{publishedTime}</span>
          {item.relevantTicker && (
            <>
              <span>·</span>
              <Badge variant="secondary" className="text-xs">
                {item.relevantTicker}
              </Badge>
            </>
          )}
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Read article
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </li>
  )
}
