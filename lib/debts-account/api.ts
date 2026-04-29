import axios from "axios"

import { API_ENDPOINTS } from "@/lib/constants/api"
import type {
  CreateDebtsTransactionRequest,
  CreateDebtsTransactionResponseContent,
  DebtsAccountSummary,
  DebtsApiErrorResponse,
  DebtsApiSuccessResponse,
  DebtsTransactionDetail,
} from "@/lib/debts-account/types"

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
