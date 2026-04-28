import axios from "axios";

import { API_ENDPOINTS } from "@/lib/constants/api";
import type {
  AccountSummary,
  ApiErrorResponse,
  ApiSuccessResponse,
  CategorySuggestionContent,
  CategorySuggestionRequest,
  CreateCheckingTransactionRequest,
  GetCheckingTransactionsParams,
  GetCheckingTransactionsResponseDTO,
  TimeSeriesPeriod,
  TimeSeriesResponse,
  TransactionType,
  VlmExtractionResponse,
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

export async function getCheckingTransactions(
  token: string,
  params: GetCheckingTransactionsParams = {},
  signal?: AbortSignal
) {
  return axios.get<ApiSuccessResponse<GetCheckingTransactionsResponseDTO> | ApiErrorResponse>(
    API_ENDPOINTS.CHECKING_TRANSACTIONS,
    {
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      params: {
        page: params.page ?? 0,
        sortBy: params.sortBy ?? "date",
        sortDirection: params.sortDirection ?? "DESC",
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
        ...(params.category && params.category.length > 0 && { category: params.category }),
        ...(params.transactionType && { transactionType: params.transactionType }),
      },
      paramsSerializer: {
        serialize: (queryParams) => {
          const searchParams = new URLSearchParams();
          Object.entries(queryParams).forEach(([key, value]) => {
            if (value === undefined || value === null) {
              return;
            }

            if (Array.isArray(value)) {
              value.forEach((item) => {
                searchParams.append(key, String(item));
              });
              return;
            }

            searchParams.append(key, String(value));
          });

          return searchParams.toString();
        },
      },
      validateStatus: () => true,
    }
  );
}

type TimeSeriesRequestParams = {
  period: TimeSeriesPeriod;
  startDate: string;
  endDate: string;
};

export async function getTimeSeriesData(
  token: string,
  params: TimeSeriesRequestParams,
  signal?: AbortSignal
) {
  return axios.get<TimeSeriesResponse>(API_ENDPOINTS.TIME_SERIES, {
    params,
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    validateStatus: () => true,
  });
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
