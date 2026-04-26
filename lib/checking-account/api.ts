import axios from "axios";

import { API_ENDPOINTS } from "@/lib/constants/api";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  CategorySuggestionContent,
  CategorySuggestionRequest,
  CreateCheckingTransactionRequest,
} from "@/lib/checking-account/types";

export async function requestCategorySuggestion(token: string, payload: CategorySuggestionRequest) {
  return axios.post<ApiSuccessResponse<CategorySuggestionContent> | ApiErrorResponse>(
    API_ENDPOINTS.CATEGORY_SUGGESTION,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      validateStatus: () => true,
    },
  );
}

export async function categorizeTransaction(token: string, payload: CategorySuggestionRequest) {
  return axios.post<ApiSuccessResponse<CategorySuggestionContent> | ApiErrorResponse>(
    API_ENDPOINTS.CATEGORIZE,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      validateStatus: () => true,
    },
  );
}

export async function createCheckingTransaction(token: string, payload: CreateCheckingTransactionRequest) {
  return axios.post<ApiSuccessResponse<Record<string, unknown>> | ApiErrorResponse>(
    API_ENDPOINTS.CHECKING_TRANSACTIONS,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      validateStatus: () => true,
    },
  );
}
