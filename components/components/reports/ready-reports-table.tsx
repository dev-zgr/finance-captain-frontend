"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format, parseISO } from "date-fns"
import { AlertCircle, Inbox } from "lucide-react"

import { listReports } from "@/lib/reports/api"
import type { ReportSummary } from "@/lib/reports/types"
import type { ApiErrorResponse } from "@/lib/checking-account/types"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { OpenPdfButton } from "@/components/components/reports/open-pdf-button"
import { ReportStatusBadge } from "@/components/components/reports/report-status-badge"

type SortBy = "createdAt" | "startDate" | "endDate"
type SortDirection = "ASC" | "DESC"

type ReadyReportsTableProps = {
  token: string
  refreshKey: number
}

function buildPaginationItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const current = currentPage + 1
  const pages = new Set<number>([1, totalPages, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const result: Array<number | "ellipsis"> = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("ellipsis")
    result.push(p)
  })
  return result
}

function formatCreatedAt(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy HH:mm")
  } catch {
    return value
  }
}

const SORT_BY_LABELS: Record<SortBy, string> = {
  createdAt: "Created",
  startDate: "Start Date",
  endDate: "End Date",
}

export function ReadyReportsTable({ token, refreshKey }: ReadyReportsTableProps) {
  const [reports, setReports] = useState<ReportSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<SortBy>("createdAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("DESC")
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isFirstFetch = useRef(true)

  const fetchReady = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    if (isFirstFetch.current) setLoading(true)
    setErrorMessage(null)

    try {
      const [completedRes, failedRes] = await Promise.all([
        listReports(token, { status: "COMPLETED", page, sortBy, sortDirection }, controller.signal),
        listReports(token, { status: "FAILED", page, sortBy, sortDirection }, controller.signal),
      ])

      if (controller.signal.aborted) return

      if (completedRes.status !== 200 && failedRes.status !== 200) {
        const body = completedRes.data as ApiErrorResponse
        setErrorMessage(body.message ?? "Failed to load reports.")
        return
      }

      const completedData = completedRes.status === 200
        ? (completedRes.data as { content?: { reports?: ReportSummary[]; totalPages?: number; totalElements?: number; pageSize?: number } }).content
        : null
      const failedData = failedRes.status === 200
        ? (failedRes.data as { content?: { reports?: ReportSummary[] } }).content
        : null

      const completedReports = completedData?.reports ?? []
      const failedReports = failedData?.reports ?? []

      const merged = [...completedReports, ...failedReports].sort((a, b) => {
        if (sortBy === "createdAt") {
          const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          return sortDirection === "DESC" ? diff : -diff
        }
        if (sortBy === "startDate") {
          const diff = new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          return sortDirection === "DESC" ? diff : -diff
        }
        return 0
      })

      const total = (completedData?.totalElements ?? 0) + (failedData?.reports?.length ?? 0)
      const pages = completedData?.totalPages ?? 1
      const size = completedData?.pageSize ?? 10

      setReports(merged)
      setTotalPages(pages)
      setTotalElements(total)
      setPageSize(size)
    } catch {
      if (controller.signal.aborted) return
      setErrorMessage("Failed to load reports. Please try again.")
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
        isFirstFetch.current = false
      }
    }
  }, [token, page, sortBy, sortDirection])

  useEffect(() => {
    isFirstFetch.current = true
    setPage(0)
  }, [refreshKey])

  useEffect(() => {
    fetchReady()
  }, [fetchReady])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (totalPages > 0 && page > totalPages - 1) {
      setPage(totalPages - 1)
    }
  }, [page, totalPages])

  const effectiveTotalPages = Math.max(totalPages, 1)
  const paginationItems = useMemo(
    () => buildPaginationItems(page, effectiveTotalPages),
    [effectiveTotalPages, page]
  )

  const start = totalElements === 0 ? 0 : page * pageSize + 1
  const end = Math.min(page * pageSize + pageSize, totalElements)

  if (loading && isFirstFetch.current) {
    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report ID</TableHead>
                <TableHead>Range</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  if (errorMessage) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex items-center gap-3">
          {errorMessage}
          <Button variant="outline" size="sm" onClick={fetchReady}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <Empty className="border-0 p-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>No reports yet</EmptyTitle>
              <EmptyDescription>Generate your first report above.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Select
          value={sortBy}
          onValueChange={(value) => {
            setSortBy(value as SortBy)
            setPage(0)
          }}
        >
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              {(Object.keys(SORT_BY_LABELS) as SortBy[]).map((key) => (
                <SelectItem key={key} value={key}>{SORT_BY_LABELS[key]}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={sortDirection}
          onValueChange={(value) => {
            setSortDirection(value as SortDirection)
            setPage(0)
          }}
        >
          <SelectTrigger size="sm" className="w-[130px]">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              <SelectItem value="DESC">Newest first</SelectItem>
              <SelectItem value="ASC">Oldest first</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="max-w-full overflow-x-auto p-0">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Report ID</TableHead>
                <TableHead className="w-[220px]">Range</TableHead>
                <TableHead className="w-[180px]">Created</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.reportId}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    Report-{report.reportId}
                  </TableCell>
                  <TableCell>
                    {report.startDate} → {report.endDate}
                  </TableCell>
                  <TableCell>{formatCreatedAt(report.createdAt)}</TableCell>
                  <TableCell>
                    <ReportStatusBadge status={report.status} />
                  </TableCell>
                  <TableCell>
                    {report.status === "COMPLETED" ? (
                      <OpenPdfButton token={token} reportId={report.reportId} />
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default text-sm text-muted-foreground">
                            Generation failed
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {report.errorMessage ?? "An error occurred during generation."}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-col items-end gap-2">
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={page === 0 || totalPages === 0}
                className={cn((page === 0 || totalPages === 0) && "pointer-events-none opacity-50")}
                onClick={(e) => {
                  e.preventDefault()
                  if (page > 0 && totalPages > 0) setPage((p) => p - 1)
                }}
              />
            </PaginationItem>
            {paginationItems.map((item, index) => (
              <PaginationItem key={`${item}-${index}`}>
                {item === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={item === page + 1}
                    className={cn(totalPages === 0 && "pointer-events-none opacity-50")}
                    onClick={(e) => {
                      e.preventDefault()
                      if (totalPages > 0) setPage(item - 1)
                    }}
                  >
                    {item}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={page >= effectiveTotalPages - 1 || totalPages === 0}
                className={cn(
                  (page >= effectiveTotalPages - 1 || totalPages === 0) && "pointer-events-none opacity-50"
                )}
                onClick={(e) => {
                  e.preventDefault()
                  if (page < effectiveTotalPages - 1 && totalPages > 0) setPage((p) => p + 1)
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        {totalElements > 0 && (
          <p className="text-xs text-muted-foreground">
            Showing {start}–{end} of {totalElements} reports
          </p>
        )}
      </div>
    </div>
  )
}
