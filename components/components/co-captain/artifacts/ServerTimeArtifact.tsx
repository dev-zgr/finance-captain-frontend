"use client"

import { useMemo } from "react"
import { Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ArtifactRendererProps } from "@/lib/co-captain/types"

type ServerTimePayload = {
  serverTime: string
}

export function ServerTimeArtifact({ artifact }: ArtifactRendererProps<unknown>) {
  const payload = useMemo(() => {
    const raw = (artifact.payload ?? {}) as Partial<ServerTimePayload>
    return { serverTime: typeof raw.serverTime === "string" ? raw.serverTime : "" }
  }, [artifact.payload])

  const formatted = useMemo(() => {
    if (!payload.serverTime) return "—"
    try {
      const date = new Date(payload.serverTime)
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      })
    } catch {
      return payload.serverTime
    }
  }, [payload.serverTime])

  return (
    <Card className="w-full">
      <CardContent className="relative p-2.5">
        <Badge
          variant="outline"
          className="absolute top-1.5 right-1.5 flex items-center gap-1 border-slate-400/30 bg-slate-500/10 px-1.5 py-0 text-[10px] text-slate-600 dark:text-slate-400 hover:bg-slate-500/10"
        >
          <Clock className="size-3" />
          Server Time
        </Badge>

        <div className="flex items-center gap-1.5 pr-28">
          <Clock className="size-3.5 shrink-0 text-muted-foreground" />
          <p className="truncate text-[11px] font-semibold tabular-nums">{formatted}</p>
        </div>
      </CardContent>
    </Card>
  )
}
