"use client"

import { useMemo, useState } from "react"
import {
  RiArrowDownSLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
} from "@remixicon/react"
import { Spinner } from "@/components/ui/spinner"
import type { ToolCallState } from "@/lib/co-captain/types"

type Props = {
  toolCall: ToolCallState
}

export function ToolCallRow({ toolCall }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  const resultText = useMemo(() => {
    if (toolCall.status === "ok") {
      return "OK"
    }

    if (toolCall.status === "failed") {
      return JSON.stringify(
        {
          errorCode: toolCall.errorCode ?? "UNKNOWN",
          errorMessage: toolCall.errorMessage ?? "Tool call failed",
        },
        null,
        2,
      )
    }

    return "Running"
  }, [toolCall.errorCode, toolCall.errorMessage, toolCall.status])

  return (
    <div className="rounded-md border bg-muted/40 px-3 py-2">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2 text-left"
      >
        {toolCall.status === "running" ? (
          <Spinner className="size-3.5 text-blue-500" />
        ) : null}
        {toolCall.status === "ok" ? (
          <RiCheckboxCircleLine className="size-4 text-emerald-600" />
        ) : null}
        {toolCall.status === "failed" ? (
          <RiErrorWarningLine className="size-4 text-amber-600" />
        ) : null}

        <span className="font-mono text-xs">{toolCall.tool}</span>

        <span className="ml-auto text-xs text-muted-foreground">
          {typeof toolCall.durationMs === "number" ? `${toolCall.durationMs}ms` : ""}
        </span>

        <RiArrowDownSLine
          className={`size-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {isExpanded ? (
        <div className="mt-2 space-y-2">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Arguments</p>
            <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(toolCall.arguments ?? {}, null, 2)}
            </pre>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Result</p>
            <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">{resultText}</pre>
          </div>
        </div>
      ) : null}
    </div>
  )
}
