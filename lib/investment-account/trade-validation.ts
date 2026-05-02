import { z } from "zod"

export const BUY_SELL_TICKER_PATTERN = /^[A-Z]{1,5}$/
export const MAX_DESCRIPTION_LENGTH = 256
export const MIN_QUANTITY = 1

export const tradeRequestSchema = z.object({
  ticker: z
    .string()
    .min(1, "Ticker is required")
    .max(5, "Ticker must be 1-5 characters")
    .regex(BUY_SELL_TICKER_PATTERN, "Ticker must be 1-5 uppercase letters"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(MIN_QUANTITY, `Quantity must be at least ${MIN_QUANTITY}`),
  description: z
    .string()
    .max(MAX_DESCRIPTION_LENGTH, `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`)
    .nullable()
    .optional(),
})

export type TradeRequestFormData = z.infer<typeof tradeRequestSchema>

/**
 * Map backend error messages to user-friendly messages
 */
export function mapTradeErrorMessage(errorCode: string, message: string): string {
  const errorMap: Record<string, string> = {
    UnsupportedTickerException: "This ticker is not supported or not found in our system.",
    MaxConcurrentPositionsExceededException:
      "You already hold 4 different stocks. Sell one before buying a new ticker.",
    InsufficientInvestmentBalanceException:
      "Insufficient investment account balance for this purchase.",
    InsufficientPositionQuantityException: "Insufficient quantity of this stock to sell.",
    MarketDataUnavailableException: "Market data is temporarily unavailable. Please try again later.",
  }

  return errorMap[errorCode] || message || "An error occurred while processing your trade."
}

/**
 * Validate quantity is sufficient
 */
export function validateQuantityRange(
  quantity: number,
  maxQuantity: number,
  isSell: boolean
): string | null {
  if (quantity < MIN_QUANTITY) {
    return `Quantity must be at least ${MIN_QUANTITY}`
  }
  if (isSell && quantity > maxQuantity) {
    return `Quantity cannot exceed ${maxQuantity}`
  }
  return null
}

/**
 * Validate sufficient balance for buy
 */
export function validateSufficientBalance(
  totalCost: number,
  availableBalance: number
): string | null {
  if (totalCost > availableBalance) {
    return "Insufficient investment account balance for this purchase."
  }
  return null
}
