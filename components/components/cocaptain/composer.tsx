"use client"

import { useEffect, useMemo, useRef } from "react"
import { ArrowUp, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type CoCaptainComposerProps = {
  value: string
  isStreaming: boolean
  disabled?: boolean
  autoFocus?: boolean
  focusSignal?: number
  onChange: (value: string) => void
  onSend: () => void
  onStop: () => void
}

function resizeTextarea(element: HTMLTextAreaElement): void {
  element.style.height = "auto"

  const computed = window.getComputedStyle(element)
  const lineHeight = Number.parseFloat(computed.lineHeight || "24")
  const maxHeight = lineHeight * 6
  element.style.height = `${Math.min(element.scrollHeight, maxHeight)}px`
}

export function CoCaptainComposer({
  value,
  isStreaming,
  disabled = false,
  autoFocus = false,
  focusSignal = 0,
  onChange,
  onSend,
  onStop,
}: CoCaptainComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!textareaRef.current) {
      return
    }

    resizeTextarea(textareaRef.current)
  }, [value])

  useEffect(() => {
    if ((!autoFocus && focusSignal === 0) || !textareaRef.current) {
      return
    }

    textareaRef.current.focus()
  }, [autoFocus, focusSignal])

  const trimmed = value.trim()
  const canSend = useMemo(() => trimmed.length > 0 && !disabled, [trimmed, disabled])

  const handleSendOrStop = () => {
    if (isStreaming) {
      onStop()
      return
    }

    if (canSend) {
      onSend()
    }
  }

  return (
    <div className="border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onInput={(event) => resizeTextarea(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) {
              return
            }

            event.preventDefault()

            if (!isStreaming && canSend) {
              onSend()
            }
          }}
          placeholder="Ask CoCaptain anything..."
          rows={1}
          className="max-h-36 min-h-11 resize-none"
          disabled={disabled || isStreaming}
        />

        <Button
          type="button"
          className="ai-shimmer size-10 rounded-full bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-primary-foreground"
          onClick={handleSendOrStop}
          disabled={!isStreaming && !canSend}
          aria-label={isStreaming ? "Stop generation" : "Send message"}
        >
          {isStreaming ? <Square data-icon="inline-start" /> : <ArrowUp data-icon="inline-start" />}
        </Button>
      </div>
    </div>
  )
}
