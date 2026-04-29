import axios from "axios"

import { API_ENDPOINTS } from "@/lib/constants/api"
import type {
  CreateDebtsTransactionRequest,
  CreateDebtsTransactionResponseContent,
  DebtsAccountSummary,
  DebtsApiErrorResponse,
  DebtsApiSuccessResponse,
  DebtsTransactionDetail,
  GetDebtsTransactionsParams,
  GetDebtsTransactionsResponse,
} from "@/lib/debts-account/types"

function isGetDebtsTransactionsResponse(
  value: unknown
): value is GetDebtsTransactionsResponse {
  if (!value || typeof value !== "object") {
    return false
  }

  const payload = value as Partial<GetDebtsTransactionsResponse>
  return (
    Array.isArray(payload.transactions) &&
    typeof payload.totalPages === "number" &&
    typeof payload.totalElements === "number"
  )
}

export function extractDebtsTransactionsResponse(
  data: unknown
): GetDebtsTransactionsResponse | null {
  if (isGetDebtsTransactionsResponse(data)) {
    return data
  }

  if (!data || typeof data !== "object") {
    return null
  }

  const wrapped = data as DebtsApiSuccessResponse<GetDebtsTransactionsResponse>
  if (isGetDebtsTransactionsResponse(wrapped.content)) {
    return wrapped.content
  }

  if (isGetDebtsTransactionsResponse(wrapped.data)) {
    return wrapped.data
  }

  return null
}

export async function getDebtsAccountSummary(
  token: string,
  signal?: AbortSignal
) {
  return axios.get<
    DebtsApiSuccessResponse<DebtsAccountSummary> | DebtsApiErrorResponse
  >(API_ENDPOINTS.DEBTS_SUMMARY, {
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    validateStatus: () => true,
  })
}

export async function getDebtsTransactions(
  token: string,
  params: GetDebtsTransactionsParams = {},
  signal?: AbortSignal
) {
  return axios.get<
    | GetDebtsTransactionsResponse
    | DebtsApiSuccessResponse<GetDebtsTransactionsResponse>
    | DebtsApiErrorResponse
  >(API_ENDPOINTS.DEBTS_TRANSACTIONS, {
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    params: {
      page: params.page ?? 0,
      sortBy: params.sortBy ?? "date",
      sortDirection: params.sortDirection ?? "DESC",
    },
    validateStatus: () => true,
  })
}

export async function getDebtsTransactionById(
  token: string,
  transactionId: string,
  signal?: AbortSignal
) {
  return axios.get<
    DebtsApiSuccessResponse<DebtsTransactionDetail> | DebtsApiErrorResponse
  >(`${API_ENDPOINTS.DEBTS_TRANSACTIONS}/${transactionId}`, {
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    validateStatus: () => true,
  })
}

export async function createDebtsTransaction(
  token: string,
  payload: CreateDebtsTransactionRequest
) {
  return axios.post<
    | DebtsApiSuccessResponse<CreateDebtsTransactionResponseContent>
    | DebtsApiErrorResponse
  >(API_ENDPOINTS.DEBTS_TRANSACTIONS, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    validateStatus: () => true,
  })
}
