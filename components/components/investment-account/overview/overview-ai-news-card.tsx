"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"

import { AiOverviewCard } from "@/components/components/investment-account/news/ai-overview-card"
import { getInvestmentNews } from "@/lib/investment-account/api"
import type {
  InvestmentApiSuccessResponse,
  InvestmentNewsResponse,
} from "@/lib/investment-account/types"
import type { RootState } from "@/lib/store"

const FALLBACK_SUMMARY =
  "Stay on top of your portfolio with AI-curated market highlights and company news."

export function OverviewAiNewsCard() {
  const token = useSelector((state: RootState) => state.auth.content?.token ?? "")

  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [positionsCardHeight, setPositionsCardHeight] = useState<number | null>(null)

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    const fetchNewsSummary = async () => {
      try {
        setIsLoading(true)

        const response = await getInvestmentNews(
          token,
          { page: 0, size: 5 },
          controller.signal
        )

        if (response.status === 200) {
          const payload = response.data as InvestmentApiSuccessResponse<InvestmentNewsResponse>
          const content = payload.content

          setSummary(content?.overallSummary ?? null)
          setGeneratedAt(content?.generatedAt ?? null)
        } else {
          setSummary(null)
          setGeneratedAt(null)
        }
      } catch {
        if (!controller.signal.aborted) {
          setSummary(null)
          setGeneratedAt(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchNewsSummary()

    return () => {
      controller.abort()
    }
  }, [token])

  useEffect(() => {
    const positionsCard = document.querySelector<HTMLElement>(
      "[data-overview-positions-card]"
    )

    if (!positionsCard) {
      return
    }

    const updateHeight = () => {
      setPositionsCardHeight(positionsCard.offsetHeight)
    }

    updateHeight()

    const resizeObserver = new ResizeObserver(() => {
      updateHeight()
    })

    resizeObserver.observe(positionsCard)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div
      className="col-span-4 max-lg:col-span-12"
      style={
        positionsCardHeight
          ? { height: `${positionsCardHeight}px`, overflow: "hidden" }
          : undefined
      }
    >
      <AiOverviewCard
        summary={summary ?? FALLBACK_SUMMARY}
        generatedAt={generatedAt}
        isLoading={isLoading}
        ctaLabel="get details"
        ctaHref="/investment-account/news"
        ctaPlacement="bottom-center"
        className="h-full"
        truncateToContainer
      />
    </div>
  )
}
