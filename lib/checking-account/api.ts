import axios from "axios";

import { API_ENDPOINTS } from "@/lib/constants/api";
import type {
  AccountSummary,
  ApiErrorResponse,
  ApiSuccessResponse,
  CategorySuggestionContent,
  CategorySuggestionRequest,
  CreateCheckingTransactionRequest,
  VlmExtractionResponse,
  TransactionType,
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

export async function getAccountSummary(token: string) {
  return axios.get<ApiSuccessResponse<AccountSummary> | ApiErrorResponse>(
    API_ENDPOINTS.CHECKING_SUMMARY,
    {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    },
  );
}

export async function extractTransactionFromImage(
  token: string,
  file: File,
  transactionType: TransactionType
) {
  const formData = new FormData();
  formData.append("imageFile", file);
  formData.append("transactionTarget", "CHECKING");
  formData.append("transactionType", transactionType);

  return axios.post<ApiSuccessResponse<VlmExtractionResponse> | ApiErrorResponse>(
    API_ENDPOINTS.VLM_EXTRACTION,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      validateStatus: () => true,
    },
  );
}
