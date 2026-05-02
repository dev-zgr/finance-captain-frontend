"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BuyFlow } from "./BuyFlow"
import { SellFlow } from "./SellFlow"
import { StockDetailsPanel } from "./StockDetailsPanel"
import type { RootState } from "@/lib/store"
import {
  setSelectedStock,
  setTradeStatus,
  setInvestmentBalance,
  clearTradeError,
  setInvestmentError,
} from "@/lib/slices/investmentAccountSlice"
import { getStockDetails, buyInvestmentPosition, sellInvestmentPosition } from "@/lib/investment-account/api"
import type { StockDetailsDTO, InvestmentTradeRequest } from "@/lib/investment-account/types"
import { mapTradeErrorMessage } from "@/lib/investment-account/trade-validation"

type TradeMode = "BUY" | "SELL"

type TradeFormProps = {
  token: string
}

export function TradeForm({ token }: TradeFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()

  // Redux state
  const summary = useSelector((state: RootState) => state.investmentAccount.summary)
  const positions = useSelector((state: RootState) => state.investmentAccount.positions?.items || [])
  const selectedStock = useSelector((state: RootState) => state.investmentAccount.selectedStock)
  const tradeStatus = useSelector((state: RootState) => state.investmentAccount.status.trade)
  const tradeError = useSelector((state: RootState) => state.investmentAccount.error.trade)

  const [mode, setMode] = useState<TradeMode>("BUY")
  const [selectedTicker, setSelectedTicker] = useState("AAPL")
  const [isLoadingStock, setIsLoadingStock] = useState(false)
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)
  const [showFadeOut, setShowFadeOut] = useState(false)

  // Initialize from query param
  useEffect(() => {
    const modeParam = searchParams.get("mode")?.toUpperCase() as TradeMode | null
    if (modeParam === "BUY" || modeParam === "SELL") {
      setMode(modeParam)
    }
  }, [searchParams])

  // Track the last fetched ticker to prevent infinite loops
  const lastFetchedTickerRef = useRef<string | null>(null)

  // Fetch stock details when ticker changes
  useEffect(() => {
    if (!selectedTicker) {
      dispatch(setSelectedStock(null))
      return
    }

    // Only fetch if ticker has actually changed
    if (lastFetchedTickerRef.current === selectedTicker) {
      return
    }

    const fetchStockDetails = async () => {
      setIsLoadingStock(true)
      const controller = new AbortController()

      try {
        const response = await getStockDetails(token, selectedTicker, controller.signal)

        if (response.status === 200) {
          const responseData = response.data as Record<string, unknown>
          const content = (responseData.content || responseData.data) as Record<string, unknown> | undefined
          if (content && typeof content === "object") {
            // Ensure ticker field exists in the response
            if ("ticker" in content || "profile" in content) {
              // If API returns nested structure with profile/quote, flatten it
              let flatContent = content as Record<string, unknown>
              
              if ("profile" in content && "quote" in content) {
                // New API response structure
                const profile = content.profile as Record<string, unknown>
                const quote = content.quote as Record<string, unknown>
                const userPosition = content.userPosition as Record<string, unknown> | undefined
                flatContent = {
                  ticker: profile.ticker,
                  companyName: profile.companyName,
                  currentPrice: quote.currentPrice,
                  change: quote.change,
                  percentChange: quote.percentChange,
                  openPrice: quote.openPrice,
                  highPrice: quote.highPrice,
                  lowPrice: quote.lowPrice,
                  previousClose: quote.previousClose,
                  userPosition: userPosition || null,
                  ...profile,
                  ...quote,
                  investmentAccountBalance: content.investmentAccountBalance,
                }
              }
              
              dispatch(setSelectedStock(flatContent as StockDetailsDTO))
              lastFetchedTickerRef.current = selectedTicker
              
              // Extract and update investment account balance if present
              if ("investmentAccountBalance" in content) {
                const balance = content.investmentAccountBalance as unknown as number
                dispatch(setInvestmentBalance(balance))
              }
            } else {
              dispatch(setSelectedStock(null))
            }
          } else {
            dispatch(setSelectedStock(null))
          }
        } else {
          // Log error response for debugging
          const errorData = response.data as Record<string, unknown>
          console.error(
            `Stock details fetch failed with status ${response.status}:`,
            errorData?.message || "Unknown error"
          )
          dispatch(setSelectedStock(null))
        }
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string }
        if (error.code !== "ECONNABORTED") {
          console.error(`Failed to fetch stock details for ${selectedTicker}:`, err)
          dispatch(setSelectedStock(null))
        }
      } finally {
        setIsLoadingStock(false)
      }
    }

    fetchStockDetails()
  }, [selectedTicker, token, dispatch])

  // Handle mode change and update URL
  const handleModeChange = (newMode: TradeMode) => {
    setMode(newMode)
    router.replace(`?mode=${newMode}`)
  }

  // Handle ticker selection
  const handleTickerChange = (ticker: string) => {
    setSelectedTicker(ticker)
  }

  // Handle buy submission
  const handleBuySubmit = async (ticker: string, quantity: number, description: string | null) => {
    dispatch(setTradeStatus("submitting"))
    dispatch(clearTradeError())

    try {
      const payload: InvestmentTradeRequest = {
        ticker,
        quantity,
        description,
      }

      const response = await buyInvestmentPosition(token, payload)

      if (response.status === 200) {
        const responseData = response.data as Record<string, unknown>
        const content = (responseData.content || responseData.data) as Record<string, unknown> | undefined
        if (content && typeof content === "object" && "investmentAccountBalance" in content) {
          const balance = content.investmentAccountBalance as unknown as number
          dispatch(setInvestmentBalance(balance))
          dispatch(setTradeStatus("success"))
          setShowSuccessOverlay(true)

          // Refetch stock details to update position info
          await getStockDetails(token, ticker).then((res) => {
            if (res.status === 200) {
              const data = res.data as Record<string, unknown>
              const content = (data.content || data.data) as Record<string, unknown> | undefined
              if (content && typeof content === "object") {
                let flatContent = content as Record<string, unknown>
                if ("profile" in content && "quote" in content) {
                  const profile = content.profile as Record<string, unknown>
                  const quote = content.quote as Record<string, unknown>
                  const userPosition = content.userPosition as Record<string, unknown> | undefined
                  flatContent = {
                    ticker: profile.ticker,
                    companyName: profile.companyName,
                    currentPrice: quote.currentPrice,
                    change: quote.change,
                    percentChange: quote.percentChange,
                    openPrice: quote.openPrice,
                    highPrice: quote.highPrice,
                    lowPrice: quote.lowPrice,
                    previousClose: quote.previousClose,
                    userPosition: userPosition || null,
                    ...profile,
                    ...quote,
                    investmentAccountBalance: content.investmentAccountBalance,
                  }
                }
                dispatch(setSelectedStock(flatContent as StockDetailsDTO))
              }
            }
          })

          // Reset after 2 seconds with fade out
          setTimeout(() => {
            setShowFadeOut(true)
          }, 1700)
          setTimeout(() => {
            setShowSuccessOverlay(false)
            setShowFadeOut(false)
            dispatch(setTradeStatus("idle"))
          }, 2000)
        } else {
          throw new Error("Invalid response format")
        }
      } else {
        // Handle error
        const errorData = response.data as Record<string, unknown>
        const errorMessage = mapTradeErrorMessage(
          (errorData?.code as string) || "UNKNOWN",
          (errorData?.message as string) || "Buy transaction failed"
        )
        dispatch(setInvestmentError({ key: "trade", error: errorMessage }))
        dispatch(setTradeStatus("error"))
      }
    } catch (err: unknown) {
      const error = err as Error
      const errorMessage = error.message || "An error occurred while processing your buy order"
      dispatch(setInvestmentError({ key: "trade", error: errorMessage }))
      dispatch(setTradeStatus("error"))
    }
  }

  // Handle sell submission
  const handleSellSubmit = async (ticker: string, quantity: number, description: string | null) => {
    dispatch(setTradeStatus("submitting"))
    dispatch(clearTradeError())

    try {
      const payload: InvestmentTradeRequest = {
        ticker,
        quantity,
        description,
      }

      const response = await sellInvestmentPosition(token, payload)

      if (response.status === 200) {
        const responseData = response.data as Record<string, unknown>
        const content = (responseData.content || responseData.data) as Record<string, unknown> | undefined
        if (content && typeof content === "object" && "investmentAccountBalance" in content) {
          const balance = content.investmentAccountBalance as unknown as number
          dispatch(setInvestmentBalance(balance))
          dispatch(setTradeStatus("success"))
          setShowSuccessOverlay(true)

          // Refetch stock details to update position info
          await getStockDetails(token, ticker).then((res) => {
            if (res.status === 200) {
              const data = res.data as Record<string, unknown>
              const content = (data.content || data.data) as Record<string, unknown> | undefined
              if (content && typeof content === "object") {
                let flatContent = content as Record<string, unknown>
                if ("profile" in content && "quote" in content) {
                  const profile = content.profile as Record<string, unknown>
                  const quote = content.quote as Record<string, unknown>
                  const userPosition = content.userPosition as Record<string, unknown> | undefined
                  flatContent = {
                    ticker: profile.ticker,
                    companyName: profile.companyName,
                    currentPrice: quote.currentPrice,
                    change: quote.change,
                    percentChange: quote.percentChange,
                    openPrice: quote.openPrice,
                    highPrice: quote.highPrice,
                    lowPrice: quote.lowPrice,
                    previousClose: quote.previousClose,
                    userPosition: userPosition || null,
                    ...profile,
                    ...quote,
                    investmentAccountBalance: content.investmentAccountBalance,
                  }
                }
                dispatch(setSelectedStock(flatContent as StockDetailsDTO))
              }
            }
          })

          // Reset after 2 seconds with fade out
          setTimeout(() => {
            setShowFadeOut(true)
          }, 1700)
          setTimeout(() => {
            setShowSuccessOverlay(false)
            setShowFadeOut(false)
            dispatch(setTradeStatus("idle"))
          }, 2000)
        } else {
          throw new Error("Invalid response format")
        }
      } else {
        // Handle error
        const errorData = response.data as Record<string, unknown>
        const errorMessage = mapTradeErrorMessage(
          (errorData?.code as string) || "UNKNOWN",
          (errorData?.message as string) || "Sell transaction failed"
        )
        dispatch(setInvestmentError({ key: "trade", error: errorMessage }))
        dispatch(setTradeStatus("error"))
      }
    } catch (err: unknown) {
      const error = err as Error
      const errorMessage = error.message || "An error occurred while processing your sell order"
      dispatch(setInvestmentError({ key: "trade", error: errorMessage }))
      dispatch(setTradeStatus("error"))
    }
  }

  const handleErrorDismiss = () => {
    dispatch(clearTradeError())
  }

  const isSubmitting = tradeStatus === "submitting"
  const cashBalance = summary?.cashBalance || 0

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left Card: Buy/Sell Forms */}
      <Card className="relative flex flex-col h-fit overflow-hidden">
        <CardHeader>
          <CardTitle>Trade Stocks</CardTitle>
        </CardHeader>
        <CardContent className="relative flex-1 overflow-y-auto">
          {/* Success Overlay - absolute within card */}
          {(showSuccessOverlay) && (
            <div
              className={`absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-white transition-all duration-300 ${
                showFadeOut ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="flex animate-in flex-col items-center gap-3 duration-300 fade-in text-center space-y-4">
                <div className="rounded-full bg-gray-200/50 p-4">
                  <div className="text-4xl text-gray-800">✓</div>
                </div>
                <h2 className="text-lg font-bold text-gray-800">
                  {mode === "BUY" ? "Buy Order Executed!" : "Sell Order Executed!"}
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedTicker} transaction completed successfully.
                </p>
              </div>
            </div>
          )}

          <div
            className={`transition-all duration-300 ${
              showSuccessOverlay && !showFadeOut ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
          >

          <Tabs value={mode} onValueChange={(val) => handleModeChange(val as TradeMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="BUY">Buy</TabsTrigger>
              <TabsTrigger value="SELL">Sell</TabsTrigger>
            </TabsList>

            <TabsContent value="BUY" className="mt-6">
              <BuyFlow
                selectedTicker={selectedTicker}
                onTickerChange={handleTickerChange}
                stockDetails={selectedStock}
                isLoadingStock={isLoadingStock}
                cashBalance={cashBalance}
                positions={positions}
                onSubmit={handleBuySubmit}
                isSubmitting={isSubmitting}
                error={mode === "BUY" ? tradeError : null}
                onErrorDismiss={handleErrorDismiss}
              />
            </TabsContent>

            <TabsContent value="SELL" className="mt-6">
              <SellFlow
                selectedTicker={selectedTicker}
                onTickerChange={handleTickerChange}
                stockDetails={selectedStock}
                isLoadingStock={isLoadingStock}
                positions={positions}
                onSubmit={handleSellSubmit}
                isSubmitting={isSubmitting}
                error={mode === "SELL" ? tradeError : null}
                onErrorDismiss={handleErrorDismiss}
              />
            </TabsContent>
          </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Right Card: Stock Details */}
      <StockDetailsPanel
        stockDetails={selectedStock}
        isLoading={isLoadingStock}
      />
    </div>
  )
}
