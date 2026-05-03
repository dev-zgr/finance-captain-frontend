import axios from "axios"

import { INVESTMENT_API } from "@/lib/constants/api"
import type {
  GetInvestmentTransactionsResponse,
  GetInvestmentPositionsParams,
  GetInvestmentTransactionsParams,
  InvestmentApiErrorResponse,
  InvestmentApiSuccessResponse,
  InvestmentCashTransactionRequest,
  InvestmentCashTransactionResponseContent,
  InvestmentNewsResponse,
  InvestmentPagedResponse,
  InvestmentTransactionRow,
  InvestmentSummary,
  InvestmentTradeRequest,
  InvestmentTransactionDTO,
  PositionDTO,
  StockDetailsDTO,
  TradeTransactionResponse,
} from "@/lib/investment-account/types"

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

function isGetInvestmentTransactionsResponse(
  value: unknown
): value is GetInvestmentTransactionsResponse {
  if (!value || typeof value !== "object") {
    return false
  }

  const payload = value as Partial<GetInvestmentTransactionsResponse>
  return (
    Array.isArray(payload.items) &&
    typeof payload.page === "number" &&
    typeof payload.size === "number" &&
    typeof payload.totalElements === "number" &&
    typeof payload.totalPages === "number"
  )
}

function normalizeTransactionRow(
  item: InvestmentTransactionRow & {
    id?: number | null
    date?: string | null
    logoUrl?: string | null
    companyLogoUrl?: string | null
    transactionType?: InvestmentTransactionRow["investmentTransactionType"] | null
    category?: InvestmentTransactionRow["investmentTransactionCategory"] | null
  }
): InvestmentTransactionRow {
  return {
    ...item,
    transactionId: item.transactionId ?? item.id ?? 0,
    transactionDate: item.transactionDate ?? item.date ?? "",
    investmentTransactionType:
      item.investmentTransactionType ?? item.transactionType ?? "TRADE",
    investmentTransactionCategory:
      item.investmentTransactionCategory ?? item.category ?? "BUY",
    companyLogoUrl: item.companyLogoUrl ?? item.symbolUrl ?? item.logoUrl ?? null,
    symbolUrl: item.symbolUrl ?? item.companyLogoUrl ?? item.logoUrl ?? null,
  }
}

export function extractInvestmentTransactionsResponse(
  data: unknown
): GetInvestmentTransactionsResponse | null {
  if (isGetInvestmentTransactionsResponse(data)) {
    return {
      ...data,
      items: data.items.map((item) => normalizeTransactionRow(item)),
    }
  }

  if (!data || typeof data !== "object") {
    return null
  }

  const wrapped = data as InvestmentApiSuccessResponse<GetInvestmentTransactionsResponse>
  if (isGetInvestmentTransactionsResponse(wrapped.content)) {
    return {
      ...wrapped.content,
      items: wrapped.content.items.map((item) => normalizeTransactionRow(item)),
    }
  }

  if (isGetInvestmentTransactionsResponse(wrapped.data)) {
    return {
      ...wrapped.data,
      items: wrapped.data.items.map((item) => normalizeTransactionRow(item)),
    }
  }

  return null
}

export async function getInvestmentSummary(token: string, signal?: AbortSignal) {
  return axios.get<
    InvestmentApiSuccessResponse<InvestmentSummary> | InvestmentApiErrorResponse
  >(INVESTMENT_API.SUMMARY, {
    signal,
    headers: authHeaders(token),
    validateStatus: () => true,
  })
}

export async function getInvestmentPositions(
  token: string,
  params: GetInvestmentPositionsParams = {},
  signal?: AbortSignal
) {
  return axios.get<
    | InvestmentPagedResponse<PositionDTO>
    | InvestmentApiSuccessResponse<InvestmentPagedResponse<PositionDTO>>
    | InvestmentApiErrorResponse
  >(INVESTMENT_API.POSITIONS, {
    params,
    signal,
    headers: authHeaders(token),
    validateStatus: () => true,
  })
}

export async function getInvestmentPositionById(
  token: string,
  positionId: string,
  signal?: AbortSignal
) {
  return axios.get<
    InvestmentApiSuccessResponse<PositionDTO> | InvestmentApiErrorResponse
  >(INVESTMENT_API.POSITION_BY_ID(positionId), {
    signal,
    headers: authHeaders(token),
    validateStatus: () => true,
  })
}

export async function getInvestmentTransactions(
  token: string,
  params: GetInvestmentTransactionsParams = {},
  signal?: AbortSignal
) {
  return axios.post<
    | GetInvestmentTransactionsResponse
    | InvestmentApiSuccessResponse<GetInvestmentTransactionsResponse>
    | InvestmentApiErrorResponse
  >(
    INVESTMENT_API.TRANSACTIONS,
    {
      page: params.page ?? 0,
      ...(typeof params.size === "number" && { size: params.size }),
      sortBy: params.sortBy ?? "date",
      sortDirection: params.sortDirection ?? "DESC",
      ...(params.transactionTypes &&
        params.transactionTypes.length > 0 && {
          transactionTypes: params.transactionTypes,
        }),
      ...(params.categories &&
        params.categories.length > 0 && { categories: params.categories }),
      ...(params.tickers &&
        params.tickers.length > 0 && { tickers: params.tickers }),
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
      ...(params.q && { q: params.q }),
    },
    {
    signal,
    headers: authHeaders(token),
    validateStatus: () => true,
    }
  )
}

export async function getInvestmentTransactionById(
  token: string,
  transactionId: number,
  signal?: AbortSignal
) {
  return axios.get<
    | InvestmentApiSuccessResponse<InvestmentTransactionDTO>
    | InvestmentApiErrorResponse
  >(INVESTMENT_API.TRANSACTION_BY_ID(transactionId), {
    signal,
    headers: authHeaders(token),
    validateStatus: () => true,
  })
}

export async function depositInvestmentCash(
  token: string,
  payload: InvestmentCashTransactionRequest
) {
  return axios.post<
    | InvestmentApiSuccessResponse<InvestmentCashTransactionResponseContent>
    | InvestmentApiErrorResponse
  >(INVESTMENT_API.DEPOSIT, payload, {
    headers: authHeaders(token),
    validateStatus: () => true,
  })
}

export async function withdrawInvestmentCash(
  token: string,
  payload: InvestmentCashTransactionRequest
) {
  return axios.post<
    | InvestmentApiSuccessResponse<InvestmentCashTransactionResponseContent>
    | InvestmentApiErrorResponse
  >(INVESTMENT_API.WITHDRAW, payload, {
    headers: authHeaders(token),
    validateStatus: () => true,
  })
}

export const apiDeposit = depositInvestmentCash
export const apiWithdraw = withdrawInvestmentCash

/**
 * Executes a buy transaction for a specified investment.
 * @param token - Authentication token
 * @param payload - { ticker, quantity, description? }
 * @returns Buy transaction response with transaction details, updated position, and account balance
 */
export async function buyInvestmentPosition(
  token: string,
  payload: InvestmentTradeRequest
) {
  return axios.post<
    TradeTransactionResponse | InvestmentApiErrorResponse
  >(INVESTMENT_API.BUY, payload, {
    headers: authHeaders(token),
    validateStatus: () => true,
  })
}

/**
 * Executes a sell transaction for a specified investment.
 * @param token - Authentication token
 * @param payload - { ticker, quantity, description? }
 * @returns Sell transaction response with transaction details, updated position, and account balance
 */
export async function sellInvestmentPosition(
  token: string,
  payload: InvestmentTradeRequest
) {
  return axios.post<
    TradeTransactionResponse | InvestmentApiErrorResponse
  >(INVESTMENT_API.SELL, payload, {
    headers: authHeaders(token),
    validateStatus: () => true,
  })
}

export async function getStockDetails(
  token: string,
  ticker: string,
  signal?: AbortSignal
) {
  return axios.get<
    InvestmentApiSuccessResponse<StockDetailsDTO> | InvestmentApiErrorResponse
  >(INVESTMENT_API.STOCK_DETAILS(ticker), {
    signal,
    headers: authHeaders(token),
    validateStatus: () => true,
  })
}

export async function getInvestmentNews(token: string, signal?: AbortSignal) {
  return axios.get<
    InvestmentApiSuccessResponse<InvestmentNewsResponse> | InvestmentApiErrorResponse
  >(INVESTMENT_API.NEWS, {
    signal,
    headers: authHeaders(token),
    validateStatus: () => true,
  })
}

export async function refreshInvestmentNews(token: string) {
  return axios.post<
    InvestmentApiSuccessResponse<InvestmentNewsResponse> | InvestmentApiErrorResponse
  >(
    INVESTMENT_API.NEWS_REFRESH,
    {},
    {
      headers: authHeaders(token),
      validateStatus: () => true,
    }
  )
}
