import axios from "axios"

import { INVESTMENT_API } from "@/lib/constants/api"
import type {
  GetInvestmentTransactionsResponse,
  GetInvestmentPositionsRequestBody,
  InvestmentPositionsContent,
  GetInvestmentTransactionsParams,
  InvestmentApiErrorResponse,
  InvestmentApiSuccessResponse,
  InvestmentCashTransactionRequest,
  InvestmentCashTransactionResponseContent,
  InvestmentNewsResponse,
  InvestmentTransactionRow,
  InvestmentSummary,
  InvestmentTradeRequest,
  InvestmentTransactionDetailContent,
  PositionEnrichedDTO,
  InvestmentPositionDetailContent,
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

export function extractInvestmentTransactionDetailContent(
  data: unknown
): InvestmentTransactionDetailContent | null {
  if (!data || typeof data !== "object") {
    return null
  }

  const wrapped = data as InvestmentApiSuccessResponse<InvestmentTransactionDetailContent>
  const payload = wrapped.content ?? wrapped.data ?? null
  if (!payload?.transaction) {
    return null
  }

  return {
    ...payload,
    transaction: normalizeTransactionRow(payload.transaction),
    linkedCheckingTransaction: payload.linkedCheckingTransaction
      ? {
          ...payload.linkedCheckingTransaction,
          transactionId:
            payload.linkedCheckingTransaction.transactionId ??
            payload.linkedCheckingTransaction.id ??
            null,
          date:
            payload.linkedCheckingTransaction.date ??
            payload.linkedCheckingTransaction.transactionDate ??
            null,
        }
      : null,
  }
}

function isPositionEnrichedDTO(value: unknown): value is PositionEnrichedDTO {
  if (!value || typeof value !== "object") {
    return false
  }

  const payload = value as Partial<PositionEnrichedDTO>
  return (
    typeof payload.id === "number" &&
    typeof payload.ticker === "string" &&
    typeof payload.companyName === "string"
  )
}

function isInvestmentPositionsContent(
  value: unknown
): value is InvestmentPositionsContent {
  if (!value || typeof value !== "object") {
    return false
  }

  const payload = value as Partial<InvestmentPositionsContent>
  return (
    typeof payload.priceDataPartial === "boolean" &&
    Array.isArray(payload.positions) &&
    payload.positions.every((position) => isPositionEnrichedDTO(position))
  )
}

export function extractInvestmentPositionsContent(
  data: unknown
): InvestmentPositionsContent | null {
  if (isInvestmentPositionsContent(data)) {
    return data
  }

  if (!data || typeof data !== "object") {
    return null
  }

  const wrapped = data as InvestmentApiSuccessResponse<InvestmentPositionsContent>
  if (isInvestmentPositionsContent(wrapped.content)) {
    return wrapped.content
  }

  if (isInvestmentPositionsContent(wrapped.data)) {
    return wrapped.data
  }

  return null
}

export function extractInvestmentPositionDetailContent(
  data: unknown
): InvestmentPositionDetailContent | null {
  if (!data || typeof data !== "object") {
    return null
  }

  const wrapped = data as InvestmentApiSuccessResponse<InvestmentPositionDetailContent>
  const payload = wrapped.content ?? wrapped.data ?? null

  if (!payload?.position || !Array.isArray(payload.transactions)) {
    return null
  }

  return payload
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
  payload: GetInvestmentPositionsRequestBody = {},
  signal?: AbortSignal
) {
  return axios.post<
    | InvestmentPositionsContent
    | InvestmentApiSuccessResponse<InvestmentPositionsContent>
    | InvestmentApiErrorResponse
  >(
    INVESTMENT_API.POSITIONS,
    {
      sortBy: payload.sortBy ?? "openedAt",
      sortDirection: payload.sortDirection ?? "ASC",
      gainLossFilter: payload.gainLossFilter ?? "ALL",
      ...(payload.q ? { q: payload.q } : {}),
    },
    {
    signal,
    headers: authHeaders(token),
    validateStatus: () => true,
    }
  )
}

export async function getInvestmentPositionById(
  token: string,
  positionId: string,
  signal?: AbortSignal
) {
  return axios.get<
    | InvestmentApiSuccessResponse<InvestmentPositionDetailContent>
    | InvestmentApiErrorResponse
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
    | InvestmentApiSuccessResponse<InvestmentTransactionDetailContent>
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

export async function getInvestmentNews(
  token: string,
  params: { page?: number; size?: number } = {},
  signal?: AbortSignal
) {
  return axios.get<
    InvestmentApiSuccessResponse<InvestmentNewsResponse> | InvestmentApiErrorResponse
  >(INVESTMENT_API.NEWS, {
    signal,
    headers: authHeaders(token),
    params: {
      page: params.page ?? 0,
      size: params.size ?? 5,
    },
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
