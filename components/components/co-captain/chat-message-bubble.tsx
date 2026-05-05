"use client"

import { useState } from "react"
import { RiCheckLine, RiFileCopyLine, RiRobot2Line } from "@remixicon/react"
import { ArtifactRenderer } from "./ArtifactRenderer"
import { ToolCallList } from "./ToolCallList"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { ChatMessage } from "@/lib/co-captain/types"

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
        <div className="w-full overflow-hidden rounded-xl border bg-card px-4 py-3 text-sm leading-relaxed text-card-foreground shadow-sm break-words [overflow-wrap:anywhere]">
          {isStreaming && !message.content ? <Spinner className="size-4 text-blue-500" /> : message.content}

          {message.artifacts && message.artifacts.length > 0 ? (
            <div className="mt-4">
              <Separator />
              <div className="mt-4 space-y-3">
                {message.artifacts.map((artifact) => (
                  <ArtifactRenderer key={artifact.id} artifact={artifact} />
                ))}
              </div>
            </div>
          ) : null}

          {message.toolCalls && message.toolCalls.length > 0 ? (
            <div className="mt-4">
              <Separator />
              <div className="mt-4">
                <ToolCallList toolCalls={message.toolCalls} />
              </div>
            </div>
          ) : null}
        </div>

        {message.content ? <CopyButton text={message.content} /> : null}
      </div>
    </div>
  )
}
