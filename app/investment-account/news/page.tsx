"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import {
  getInvestmentNews,
  refreshInvestmentNews,
} from "@/lib/investment-account/api"
import type {
  InvestmentApiErrorResponse,
  InvestmentApiSuccessResponse,
  InvestmentNewsResponse,
} from "@/lib/investment-account/types"
import type { RootState } from "@/lib/store"
import { InvestmentNewsCard } from "@/components/components/investment-account/news/investment-news-card"

export default function InvestmentNewsPage() {
  const token = useSelector((state: RootState) => state.auth.content?.token ?? "")

  // State
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [newsData, setNewsData] = useState<InvestmentNewsResponse | null>(null)
  const [status, setStatus] = useState<"READY" | "PENDING" | "ERROR">("READY")
  const [error, setError] = useState<string | null>(null)
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [refreshDisabled, setRefreshDisabled] = useState(false)
  const [refreshCountdown, setRefreshCountdown] = useState(0)
  const countdownInterval = useRef<NodeJS.Timeout | undefined>(undefined)

  // Fetch news when page or token changes
  useEffect(() => {
    if (!token) return

    const fetchNews = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await getInvestmentNews(token, { page: currentPage, size: 5 })

        if (response.status === 200) {
          const responseData = response.data as InvestmentApiSuccessResponse<InvestmentNewsResponse>
          const content = responseData.content
          if (content) {
            setNewsData(content)
            setStatus(content.generationStatus)
          }
        } else if (response.status === 401) {
          setError("Your session has expired. Please log in again.")
          setStatus("ERROR")
        } else if (response.status === 400) {
          const payload = response.data as InvestmentApiErrorResponse
          setError(payload.message ?? "Invalid request parameters.")
          setStatus("ERROR")
        } else {
          const payload = response.data as InvestmentApiErrorResponse
          setError(payload.message ?? "Could not load news. Please try again.")
          setStatus("ERROR")
        }
      } catch (err) {
        console.error("Error fetching news:", err)
        setError("Could not load news. Please try again.")
        setStatus("ERROR")
      } finally {
        setIsLoading(false)
      }
    }

    fetchNews()
  }, [token, currentPage])

  // Countdown timer effect
  useEffect(() => {
    if (refreshCountdown <= 0) {
      if (countdownInterval.current) clearInterval(countdownInterval.current)
      return
    }

    setRefreshDisabled(true)

    countdownInterval.current = setInterval(() => {
      setRefreshCountdown((prev) => {
        const next = prev - 1
        if (next <= 0) {
          setRefreshDisabled(false)
          if (countdownInterval.current) clearInterval(countdownInterval.current)
        }
        return next
      })
    }, 1000)

    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current)
    }
  }, [refreshCountdown])

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (!token || refreshDisabled || refreshLoading) return

    try {
      setRefreshLoading(true)
      setStatus("PENDING")
      setError(null)

      const response = await refreshInvestmentNews(token)

      if (response.status === 202) {
        // Success - refresh queued
      } else if (response.status === 429) {
        const payload = response.data as InvestmentApiErrorResponse & {
          retryAfterSeconds?: number
        }
        const retryAfter = payload.retryAfterSeconds ?? 120
        setRefreshCountdown(retryAfter)
        setRefreshDisabled(true)
      } else if (response.status === 401) {
        setError("Your session has expired. Please log in again.")
        setStatus("ERROR")
      } else {
        const payload = response.data as InvestmentApiErrorResponse
        setError(payload.message ?? "Could not refresh news. Please try again.")
        setStatus("ERROR")
      }
    } catch (err) {
      console.error("Error refreshing news:", err)
      setError("Could not refresh news. Please try again.")
      setStatus("ERROR")
    } finally {
      setRefreshLoading(false)
    }
  }, [token, refreshDisabled, refreshLoading])

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage)
  }, [])

  return (
    <section className="space-y-6">
      <InvestmentNewsCard
        status={status}
        items={newsData?.items || []}
        overallSummary={newsData?.overallSummary || null}
        generatedAt={newsData?.generatedAt || null}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        refreshDisabled={refreshDisabled || refreshLoading}
        refreshTooltip={
          refreshCountdown > 0
            ? `You can refresh again in ${refreshCountdown}s`
            : null
        }
        error={error}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        totalPages={newsData?.totalPages || 0}
      />
    </section>
  )
}


