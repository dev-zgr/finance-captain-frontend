import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/lib/checking-account/types"

export type InvestmentApiSuccessResponse<T> = ApiSuccessResponse<T> & {
  data?: T
}

export type InvestmentApiErrorResponse = ApiErrorResponse

export type InvestmentAccountStatus =
  | "idle"
  | "loading"
  | "succeeded"
  | "failed"

export type InvestmentTransactionType =
  | "DEPOSIT"
  | "WITHDRAW"
  | "BUY"
  | "SELL"

export type NewsGenerationStatus = "READY" | "PENDING"

export type InvestmentSummary = {
  accountBalance: number
  totalPortfolioValue: number
  totalGainLoss: number
  totalGainLossPercentage: number
  cashBalance: number
  investedAmount: number
  accountOpeningDate: string | null
}

export type PositionDTO = {
  positionId: string
  ticker: string
  companyName: string
  quantity: number
  averageCost: number
  currentPrice: number
  marketValue: number
  totalGainLoss: number
  totalGainLossPercentage: number
  updatedAt?: string | null
}

export type InvestmentTransactionDTO = {
  transactionId: number
  transactionType: InvestmentTransactionType
  ticker?: string | null
  companyName?: string | null
  quantity?: number | null
  price?: number | null
  amount: number
  date: string
  description?: string | null
}

export type StockDetailsDTO = {
  ticker: string
  companyName: string
  currentPrice: number
  dayChange?: number | null
  dayChangePercentage?: number | null
  marketCap?: number | null
  volume?: number | null
  previousClose?: number | null
  updatedAt?: string | null
}

export type NewsItemDTO = {
  id: string
  title: string
  summary: string
  source: string
  url: string
  publishedAt: string
  relatedTickers?: string[]
}

export type InvestmentPagedResponse<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type InvestmentNewsResponse = {
  items: NewsItemDTO[]
  overallSummary: string | null
  generationStatus: NewsGenerationStatus | null
  generatedAt: string | null
}

export type GetInvestmentPositionsParams = {
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: "ASC" | "DESC"
}

export type GetInvestmentTransactionsParams = GetInvestmentPositionsParams & {
  startDate?: string
  endDate?: string
  transactionType?: InvestmentTransactionType
  ticker?: string
}

export type InvestmentCashTransactionRequest = {
  amount: number
  description: string | null
}

export type InvestmentCashTransactionResponseContent = {
  transaction: InvestmentTransactionDTO
  investmentAccountBalance: number
  checkingAccountBalance: number
}

export type InvestmentTradeRequest = {
  ticker: string
  quantity: number
  price: number
  date: string
  description?: string
}
