"use client"

import { useEffect, useMemo, useState } from "react"
import { Sparkles } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

const EMPTY_STATE_PROMPTS = [
  "Ask me to check balances across your accounts.",
  "Ask me to add an expense from yesterday.",
  "Ask me to categorize recent transactions.",
  "Ask me to summarize your portfolio performance.",
  "Ask me to draft a monthly spending review.",
  "Ask me to compare this month vs last month.",
  "Ask me to find unusual spending patterns.",
  "Ask me to plan trades based on your goals.",
  "Ask me to break down expenses by category.",
  "Ask me to prepare a debt payment strategy.",
  "Ask me to estimate your monthly cash runway.",
  "Ask me to suggest budget adjustments.",
] as const

const PROMPT_GRADIENTS = [
  "from-sky-500 via-blue-500 to-indigo-500",
  "from-violet-500 via-fuchsia-500 to-pink-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-amber-500 via-orange-500 to-rose-500",
] as const

export function CoCaptainEmptyState() {
  const [promptIndex, setPromptIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIsVisible(false)

      window.setTimeout(() => {
        setPromptIndex((prev) => (prev + 1) % EMPTY_STATE_PROMPTS.length)
        setIsVisible(true)
      }, 180)
    }, 2400)

    return () => window.clearInterval(timer)
  }, [])

  const promptGradient = useMemo(() => {
    return PROMPT_GRADIENTS[promptIndex % PROMPT_GRADIENTS.length]
  }, [promptIndex])

  return (
    <Empty className="border-none">
      <EmptyHeader>
        <EmptyMedia>
          <span className="ai-shimmer rounded-2xl bg-gradient-to-r from-violet-500 via-pink-500 to-sky-500 p-4 text-primary-foreground shadow-sm">
            <Sparkles className="size-12" />
          </span>
        </EmptyMedia>
        <h1 className="bg-gradient-to-r from-violet-500 via-pink-500 to-sky-500 bg-clip-text text-3xl font-semibold text-transparent">
          Finance Captain CoCaptain AI
        </h1>
        <EmptyTitle className="sr-only">CoCaptain</EmptyTitle>
        <EmptyDescription
          className={`animate-gradient bg-gradient-to-r ${promptGradient} bg-clip-text !text-transparent transition-opacity duration-200 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {EMPTY_STATE_PROMPTS[promptIndex]}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
