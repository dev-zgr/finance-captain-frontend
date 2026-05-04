import axios from "axios"

import { API_ENDPOINTS } from "@/lib/constants/api"
import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/checking-account/types"
import type {
  CreateReportContent,
  CreateReportRequest,
  ListReportsContent,
  ListReportsParams,
  ReportDetail,
} from "@/lib/reports/types"

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export async function createReport(token: string, body: CreateReportRequest) {
  return axios.post<ApiSuccessResponse<CreateReportContent> | ApiErrorResponse>(
    API_ENDPOINTS.REPORTS,
    body,
    {
      headers: authHeaders(token),
      validateStatus: () => true,
    }
  )
}

export async function listReports(
  token: string,
  params: ListReportsParams = {},
  signal?: AbortSignal
) {
  return axios.get<ApiSuccessResponse<ListReportsContent> | ApiErrorResponse>(
    API_ENDPOINTS.REPORTS,
    {
      signal,
      headers: authHeaders(token),
      params: {
        ...(params.page !== undefined && { page: params.page }),
        ...(params.sortBy && { sortBy: params.sortBy }),
        ...(params.sortDirection && { sortDirection: params.sortDirection }),
        ...(params.status && { status: params.status }),
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
      },
      validateStatus: () => true,
    }
  )
}

export async function getReportById(token: string, id: number, signal?: AbortSignal) {
  return axios.get<ApiSuccessResponse<ReportDetail> | ApiErrorResponse>(
    API_ENDPOINTS.REPORTS_BY_ID(id),
    {
      signal,
      headers: authHeaders(token),
      validateStatus: () => true,
    }
  )
}

export async function fetchReportFile(token: string, id: number, signal?: AbortSignal) {
  return axios.get<Blob>(API_ENDPOINTS.REPORTS_FILE(id), {
    signal,
    headers: { Authorization: `Bearer ${token}` },
    responseType: "blob",
    validateStatus: () => true,
  })
}
