export type ReportStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED"

export interface ReportSummary {
  reportId: number
  status: ReportStatus
  startDate: string
  endDate: string
  createdAt: string
  completedAt?: string
  durationMs?: number
  errorMessage?: string
}

export interface ReportDetail extends ReportSummary {
  pdfUrl?: string
  fileSizeBytes?: number
}

export interface CreateReportRequest {
  startDate: string
  endDate: string
}

export type CreateReportContent = ReportSummary

export interface ListReportsContent {
  reports: ReportSummary[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export interface ListReportsParams {
  page?: number
  sortBy?: "createdAt" | "startDate" | "endDate"
  sortDirection?: "ASC" | "DESC"
  status?: ReportStatus
  startDate?: string
  endDate?: string
}
