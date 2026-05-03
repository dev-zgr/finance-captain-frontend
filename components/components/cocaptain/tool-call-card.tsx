"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2, ChevronDown, Wrench } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export type ToolCallCardStatus = "running" | "success" | "error"

type ToolCallCardProps = {
  toolName: string
  status: ToolCallCardStatus
  argumentsPayload?: unknown
  resultPayload?: unknown
  errorMessage?: string
}

function stringify(payload: unknown): string {
  if (payload === undefined) {
    return ""
  }

  try {
    return JSON.stringify(payload, null, 2)
  } catch {
    return String(payload)
  }
}

function StatusPill({ status }: { status: ToolCallCardStatus }) {
  if (status === "running") {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <Spinner />
        Running...
      </Badge>
    )
  }

  if (status === "success") {
    return (
      <Badge variant="secondary" className="gap-1.5 text-chart-1">
        <CheckCircle2 />
        OK
      </Badge>
    )
  }

  return (
    <Badge variant="destructive" className="gap-1.5">
      <AlertCircle />
      ERROR
    </Badge>
  )
}

export function ToolCallCard({
  toolName,
  status,
  argumentsPayload,
  resultPayload,
  errorMessage,
}: ToolCallCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CardHeader className="px-3 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Wrench className="text-muted-foreground" size={16} />
              <span className="truncate font-mono text-xs">{toolName}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={status} />
              <CollapsibleTrigger
                className="inline-flex items-center justify-center rounded-md border border-border px-1 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={isOpen ? "Collapse tool details" : "Expand tool details"}
              >
                <ChevronDown
                  size={12}
                  className={cn("transition-transform", isOpen && "rotate-180")}
                />
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-2 px-3 py-2">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-muted-foreground">Arguments</p>
              <pre className="overflow-x-auto rounded-md border bg-muted/40 p-1.5 text-xs">
                {stringify(argumentsPayload) || "{}"}
              </pre>
            </div>

            {resultPayload !== undefined ? (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground">Result</p>
                <pre className="overflow-x-auto rounded-md border bg-muted/40 p-1.5 text-xs">
                  {stringify(resultPayload)}
                </pre>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive">
                {errorMessage}
              </div>
            ) : null}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
