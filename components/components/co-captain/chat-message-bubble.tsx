"use client"

import { useState } from "react"
import {
  RiCheckLine,
  RiCloseLine,
  RiFileCopyLine,
  RiLoader4Line,
  RiRobot2Line,
  RiToolsLine,
} from "@remixicon/react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import type { ChatMessage, ToolCallRecord } from "@/lib/co-captain/types"

function ToolStatusBadge({ status, error }: { status: ToolCallRecord["status"]; error?: string }) {
  if (status === "running") {
    return (
      <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-700">
        <RiLoader4Line data-icon="inline-start" className="animate-spin" />
        Running
      </Badge>
    )
  }
  if (status === "success") {
    return (
      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700">
        <RiCheckLine data-icon="inline-start" />
        Done
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700" title={error}>
      <RiCloseLine data-icon="inline-start" />
      Failed
    </Badge>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy message"
      className="mt-1.5 inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? <RiCheckLine size={12} /> : <RiFileCopyLine size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

const avatarAI = (
  <div className="relative mt-1 size-8 shrink-0 overflow-hidden rounded-full shadow-sm">
    <div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899,#f59e0b,#10b981)",
      }}
    />
    <div className="relative flex h-full w-full items-center justify-center text-white">
      <RiRobot2Line size={15} />
    </div>
  </div>
)

type Props = {
  message: ChatMessage
  isStreaming?: boolean
}

export function ChatMessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === "user"

  if (isUser) {
    return (
      <div className="flex items-start justify-end">
        <div className="max-w-[75%] rounded-xl border bg-card px-4 py-3 text-sm leading-relaxed text-card-foreground shadow-sm">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full items-start gap-3">
      {avatarAI}
      <div className="w-full max-w-[75%] min-w-0">
        <div
          className={[
            "w-full overflow-hidden rounded-xl border bg-card px-4 py-3 text-sm leading-relaxed text-card-foreground shadow-sm break-words [overflow-wrap:anywhere]",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {isStreaming && !message.content ? (
            <Spinner className="size-4 text-blue-500" />
          ) : (
            message.content
          )}

          {message.toolCalls && message.toolCalls.length > 0 && (
            <>
              <Separator className="mt-3 mb-0" />
              <ItemGroup className="mt-2">
                {message.toolCalls.map((tc, i) => (
                  <Item key={i} variant="outline" size="xs">
                    <ItemMedia variant="icon">
                      <RiToolsLine className="text-muted-foreground" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="font-mono text-xs">{tc.tool}</ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      <ToolStatusBadge status={tc.status} error={tc.error} />
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            </>
          )}
        </div>

        {message.content && <CopyButton text={message.content} />}
      </div>
    </div>
  )
}
