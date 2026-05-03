"use client"

import { useState } from "react"
import { Check, Copy, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { ArtifactRenderer } from "@/components/components/cocaptain/artifact-renderer"
import { ThinkingIndicator } from "@/components/components/cocaptain/thinking-indicator"
import { ToolCallCard } from "@/components/components/cocaptain/tool-call-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ChatMessage, CoCaptainArtifact } from "@/lib/cocaptain/types"
import { cn } from "@/lib/utils"

type MessageBubbleProps = {
  token: string
  message: ChatMessage
  showThinking?: boolean
  onArtifactChange: (messageId: string, artifact: CoCaptainArtifact) => void
  onDraftActionSuccess: (
    messageId: string,
    artifact: CoCaptainArtifact,
    outcome: "accepted" | "rejected",
  ) => void
}

function stripArtifactMarkers(text: string): string {
  return text.replace(/\[[a-zA-Z0-9_-]+\]/g, " ").replace(/\s+/g, " ").trim()
}

function compactCaption(text: string, maxLength = 80): string {
  const cleaned = stripArtifactMarkers(text)
  if (!cleaned) {
    return ""
  }

  if (cleaned.length <= maxLength) {
    return cleaned
  }

  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return true
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand("copy")
  document.body.removeChild(textarea)
  return copied
}

export function MessageBubble({
  token,
  message,
  showThinking = false,
  onArtifactChange,
  onDraftActionSuccess,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)

  if (message.role === "user") {
    const text = message.segments
      .filter((segment) => segment.type === "text")
      .map((segment) => segment.content)
      .join("")

    return (
      <div className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-2">
        <div aria-hidden="true" />
        <div className="justify-self-end max-w-[75%] min-h-10 rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground shadow-sm">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
        </div>
      </div>
    )
  }

  const assistantText = message.segments
    .map((segment) => {
      if (segment.type === "text") {
        return segment.content
      }

      if (segment.type === "error") {
        return segment.message
      }

      return ""
    })
    .join("\n")
    .trim()
  const artifactSegments = message.segments.filter((segment) => segment.type === "artifact")
  const hasArtifacts = artifactSegments.length > 0
  const rawTextSegments = message.segments.filter((segment) => segment.type === "text")
  const combinedRawText = rawTextSegments.map((segment) => segment.content).join(" ").trim()
  const cleanedCaption = compactCaption(combinedRawText)
  const artifactTypeSet = new Set(artifactSegments.map((segment) => segment.artifact.type.toLowerCase()))
  const normalizedCaption = cleanedCaption.toLowerCase().replace(/\s+/g, "_")
  const isLabelOnlyCaption =
    Boolean(normalizedCaption) &&
    (artifactTypeSet.has(normalizedCaption) ||
      artifactTypeSet.has(normalizedCaption.replace(/^here_are_your_/, "")))
  const artifactCaption =
    !cleanedCaption || isLabelOnlyCaption
      ? "Here are your account details:"
      : cleanedCaption

  const toolCallSegments = message.segments.filter((segment) => segment.type === "tool-call")

  const handleCopy = async () => {
    if (!assistantText) {
      toast.error("There is no assistant text to copy yet.")
      return
    }

    try {
      const isCopied = await copyToClipboard(assistantText)
      if (!isCopied) {
        throw new Error("Copy failed")
      }

      setCopied(true)
      toast.success("Response copied.")
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Could not copy response.")
    }
  }

  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-2">
      <div className="ai-shimmer flex size-8 items-center justify-center rounded-md bg-gradient-to-r from-violet-500 via-pink-500 to-sky-500 text-primary-foreground">
        <Sparkles />
      </div>
      <div className="flex w-full flex-col items-stretch gap-1">
        <Card className="min-h-10">
          <CardContent className="flex flex-col gap-3 py-3">
            {hasArtifacts ? (
              <>
                {artifactCaption ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{artifactCaption}</p>
                ) : null}
                {artifactSegments.map((segment) => (
                  <ArtifactRenderer
                    key={segment.id}
                    token={token}
                    artifact={segment.artifact}
                    onArtifactChange={(artifact) => onArtifactChange(message.id, artifact)}
                    onDraftActionSuccess={(artifact, outcome) =>
                      onDraftActionSuccess(message.id, artifact, outcome)
                    }
                  />
                ))}
                {message.segments
                  .filter((segment) => segment.type === "error")
                  .map((segment) => (
                    <div
                      key={segment.id}
                      className={cn(
                        "rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-sm text-destructive",
                      )}
                    >
                      {segment.message}
                    </div>
                  ))}
              </>
            ) : (
              message.segments.map((segment) => {
                if (segment.type === "text") {
                  const cleanedText = stripArtifactMarkers(segment.content)
                  if (!cleanedText) {
                    return null
                  }

                  return (
                    <p key={segment.id} className="whitespace-pre-wrap text-sm leading-relaxed">
                      {cleanedText}
                    </p>
                  )
                }

                if (segment.type === "tool-call") {
                  return null
                }

                if (segment.type === "artifact") {
                  return (
                    <ArtifactRenderer
                      key={segment.id}
                      token={token}
                      artifact={segment.artifact}
                      onArtifactChange={(artifact) => onArtifactChange(message.id, artifact)}
                      onDraftActionSuccess={(artifact, outcome) =>
                        onDraftActionSuccess(message.id, artifact, outcome)
                      }
                    />
                  )
                }

                return (
                  <div
                    key={segment.id}
                    className={cn(
                      "rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-sm text-destructive",
                    )}
                  >
                    {segment.message}
                  </div>
                )
              })
            )}

            {showThinking ? <ThinkingIndicator /> : null}

            {toolCallSegments.length > 0 ? (
              <div className="flex flex-col gap-1.5 border-t border-border/70 pt-2">
                {toolCallSegments.map((segment) => (
                  <ToolCallCard
                    key={segment.id}
                    toolName={segment.toolName}
                    status={segment.status}
                    argumentsPayload={segment.arguments}
                    resultPayload={segment.result}
                    errorMessage={segment.errorMessage}
                  />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground/60 hover:text-muted-foreground"
            onClick={() => void handleCopy()}
            aria-label="Copy assistant response"
          >
            {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
