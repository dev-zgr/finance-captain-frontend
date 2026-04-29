import axios from "axios";

import { API_ENDPOINTS } from "@/lib/constants/api";
import type {
  AccountSummary,
  ApiErrorResponse,
  ApiSuccessResponse,
  CategorySuggestionContent,
  CategorySuggestionRequest,
  CreateCheckingTransactionRequest,
  GetTransactionsParams,
  GetTransactionsResponse,
  TimeSeriesPeriod,
  TimeSeriesResponse,
  TransactionDetail,
  TransactionType,
  VlmExtractionResponse,
} from "@/lib/checking-account/types";

function isGetTransactionsResponse(value: unknown): value is GetTransactionsResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<GetTransactionsResponse>;
  return (
    Array.isArray(payload.transactions) &&
    typeof payload.totalPages === "number" &&
    typeof payload.totalElements === "number"
  );
}

export function extractCheckingTransactionsResponse(data: unknown): GetTransactionsResponse | null {
  if (isGetTransactionsResponse(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  const wrapped = data as ApiSuccessResponse<GetTransactionsResponse>;
  if (isGetTransactionsResponse(wrapped.content)) {
    return wrapped.content;
  }

  return null;
}

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

export async function getAccountSummary(token: string, signal?: AbortSignal) {
  return axios.get<ApiSuccessResponse<AccountSummary> | ApiErrorResponse>(
    API_ENDPOINTS.CHECKING_SUMMARY,
    {
      signal,
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    },
  );
}

export async function getCheckingTransactions(
  token: string,
  params: GetTransactionsParams = {},
  signal?: AbortSignal
) {
  return axios.get<GetTransactionsResponse | ApiErrorResponse>(
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

export async function getCheckingTransactionById(
  token: string,
  transactionId: string,
  signal?: AbortSignal
) {
  return axios.get<ApiSuccessResponse<TransactionDetail> | ApiErrorResponse>(
    `${API_ENDPOINTS.CHECKING_TRANSACTION_BY_ID}/${transactionId}`,
    {
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      validateStatus: () => true,
    },
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
