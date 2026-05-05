"use client"

import { useState, type KeyboardEvent } from "react"
import { RiArrowUpLine } from "@remixicon/react"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  onSubmit: (text: string) => void
  disabled: boolean
}

export function ChatInput({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState("")
  const canSend = !disabled && value.trim().length > 0

  function handleSubmit() {
    if (!canSend) return
    onSubmit(value.trim())
    setValue("")
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t py-4">
      <div className="mx-auto flex w-full max-w-2xl items-end gap-3 px-4">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Co-Captain anything about your finances…"
          className="max-h-40 min-h-[44px] resize-none"
          disabled={disabled}
          rows={1}
        />
        <button
          onClick={handleSubmit}
          disabled={!canSend}
          aria-label="Send message"
          className={`
            group relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full
            text-white shadow-md transition-all duration-200
            disabled:cursor-not-allowed disabled:opacity-40
            ${canSend ? "hover:scale-105 hover:shadow-blue-400/40 hover:shadow-lg" : ""}
          `}
          style={{
            background: canSend
              ? "linear-gradient(135deg,#3b82f6,#6366f1)"
              : "linear-gradient(135deg,#93c5fd,#a5b4fc)",
          }}
        >
          {/* subtle ping ring when active */}
          {canSend && (
            <span className="absolute inset-0 rounded-full bg-blue-400 opacity-0 transition-opacity group-hover:animate-ping group-hover:opacity-20" />
          )}
          <RiArrowUpLine
            size={18}
            className="relative z-10 transition-transform duration-150 group-hover:-translate-y-0.5"
          />
        </button>
      </div>
    </div>
  )
}
