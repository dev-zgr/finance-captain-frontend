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
  | "TRANSFER"
  | "TRADE"
export type InvestmentTransactionCategory =
  | "DEPOSIT"
  | "WITHDRAW"
  | "BUY"
  | "SELL"
export type InvestmentSortBy = "date" | "amount"

export type NewsGenerationStatus = "READY" | "PENDING"

export type InvestmentSummary = {
  hasAccount: boolean
  openingDate: string
  cashBalance: number
  marketValue: number
  accountValue: number
  totalCostBasis: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  thisMonthNetPnl: number
  previousMonthNetPnl: number
  portfolioGrowthRatePercent: number | null
  priceDataPartial: boolean
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

export type InvestmentTransactionRow = {
  transactionId: number
  investmentTransactionType: InvestmentTransactionType
  investmentTransactionCategory: InvestmentTransactionCategory
  amount: number
  transactionDate: string
  description?: string | null
  ticker?: string | null
  quantity?: number | null
  pricePerShare?: number | null
  realizedProfitLoss?: number | null
  linkedCheckingTransactionId?: number | null
  symbolUrl?: string | null
  companyLogoUrl?: string | null
}

export type InvestmentBalancesSnapshot = {
  investmentAccountBalance?: number | null
  checkingAccountBalance?: number | null
}

export type InvestmentTransactionDetailContent = {
  transaction: InvestmentTransactionRow
  linkedCheckingTransaction?: {
    transactionId?: number | null
    id?: number | null
    date?: string | null
    transactionDate?: string | null
    amount?: number | null
    category?: string | null
    description?: string | null
    transactionType?: string | null
  } | null
  linkedPosition?: PositionSnapshot | null
  balances?: InvestmentBalancesSnapshot | null
  costBasisUsed?: number | null
  realizedProfitLoss?: number | null
  priceDataPartial?: boolean | null
}

export type GetInvestmentTransactionsResponse = {
  items: InvestmentTransactionRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
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
  industry?: string | null
  exchange?: string | null
  ipoDate?: string | null
  website?: string | null
  logo?: string | null
  open?: number | null
  high?: number | null
  low?: number | null
  updatedAt?: string | null
  // New fields from /stocks/{ticker} endpoint
  change?: number | null
  percentChange?: number | null
  highPrice?: number | null
  lowPrice?: number | null
  openPrice?: number | null
  logoUrl?: string | null
  weburl?: string | null
  // User position from stock details response
  userPosition?: {
    ticker: string
    companyName: string
    quantity: number
    averageBuyPrice: number
    totalCostBasis: number
    currentPrice: number
    marketValue: number
    unrealizedPnl: number
    unrealizedPnlPercent: number
    openedAt: string
  } | null
}

export type NewsItemDTO = {
  title: string
  aiSummary: string
  link: string
  imageUrl: string | null
  sourceName: string
  publishedAt: string
  relevantTicker: string | null
}

export type InvestmentPagedResponse<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type InvestmentNewsResponse = {
  generationStatus: NewsGenerationStatus
  jobId: string | null
  generatedAt: string | null
  tickerSetHash: string | null
  overallSummary: string | null
  items: NewsItemDTO[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type GetInvestmentPositionsParams = {
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: "ASC" | "DESC"
}

export type InvestmentPositionsSortBy =
  | "ticker"
  | "companyName"
  | "currentPrice"
  | "previousClose"
  | "dayChange"
  | "dayChangePercent"
  | "quantity"
  | "averageBuyPrice"
  | "totalCostBasis"
  | "marketValue"
  | "unrealizedPnl"
  | "unrealizedPnlPercent"
  | "openedAt"

export type GainLossFilter = "ALL" | "GAINERS" | "LOSERS"

export type GetInvestmentPositionsRequestBody = {
  sortBy?: InvestmentPositionsSortBy
  sortDirection?: "ASC" | "DESC"
  q?: string
  gainLossFilter?: GainLossFilter
}

export type PositionEnrichedDTO = {
  id: number
  ticker: string
  companyName: string
  logoUrl?: string | null
  quantity: number
  averageBuyPrice: number
  totalCostBasis: number
  currentPrice: number
  previousClose: number
  dayChange: number
  dayChangePercent: number
  marketValue: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  openedAt: string
}

export type InvestmentPositionsContent = {
  priceDataPartial: boolean
  positions: PositionEnrichedDTO[]
}

export type PositionTableRow = PositionEnrichedDTO & {
  positionId: string
  totalGainLoss: number
  totalGainLossPercent: number
}

export type GetInvestmentTransactionsParams = {
  page?: number
  size?: number
  sortBy?: InvestmentSortBy
  sortDirection?: "ASC" | "DESC"
  transactionTypes?: InvestmentTransactionType[]
  categories?: InvestmentTransactionCategory[]
  tickers?: string[]
  startDate?: string
  endDate?: string
  q?: string
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
  description?: string | null
}

export type TradeTransactionDTO = {
  id: number
  transactionType: "BUY" | "SELL"
  ticker: string
  quantity: number
  pricePerShare: number
  amount: number
  transactionDate: string
  description?: string | null
  realizedProfitLoss: number
}

export type PositionSnapshot = {
  ticker: string
  companyName: string
  quantity: number
  averageBuyPrice: number
  totalCostBasis: number
  currentPrice: number
  marketValue: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  openedAt: string
}

export type TradeTransactionResponseContent = {
  transaction: TradeTransactionDTO
  position: PositionSnapshot
  investmentAccountBalance: number
}

export type TradeTransactionResponse = InvestmentApiSuccessResponse<TradeTransactionResponseContent> & {
  message?: string
}

export type InvestmentPositionDetailTransactionType =
  | "TRADE"
  | "DIVIDEND"
  | "STOCK_SPLIT"
  | "CORPORATE_ACTION"

export type InvestmentPositionDetailTransactionCategory =
  | "BUY"
  | "SELL"
  | "DIVIDEND"
  | "REINVEST"

export type PositionDetail = {
  status: string
  ticker: string
  companyName: string
  logoUrl: string | null
  industry: string | null
  quantity: number
  averageBuyPrice: number
  totalCostBasis: number
  currentPrice: number
  marketValue: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  realizedPnlToDate: number | null
  openedAt: string
  closedAt: string | null
}

export type PositionDetailTransaction = {
  id: number
  investmentTransactionType: InvestmentPositionDetailTransactionType
  investmentTransactionCategory: InvestmentPositionDetailTransactionCategory
  quantity: number
  pricePerShare: number
  amount: number
  realizedProfitLoss: number | null
  transactionDate: string
  description: string
  currentPrice: number
  marketValueAtCurrentPrice: number
  unrealizedPnlAtCurrentPrice: number
  unrealizedPnlPercentAtCurrentPrice: number
}

export type InvestmentPositionDetailContent = {
  position: PositionDetail
  transactions: PositionDetailTransaction[]
  priceDataPartial: boolean
}
