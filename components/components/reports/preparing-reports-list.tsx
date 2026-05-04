"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { format, formatDistanceToNow, parseISO } from "date-fns"
import { AlertCircle, Inbox } from "lucide-react"
import { toast } from "sonner"

import { getReportById, listReports } from "@/lib/reports/api"
import { POLLING_INTERVAL_MS } from "@/lib/reports/constants"
import type { ReportSummary } from "@/lib/reports/types"
import type { ApiErrorResponse } from "@/lib/checking-account/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReportStatusBadge } from "@/components/components/reports/report-status-badge"

type PreparingReportsListProps = {
  token: string
  isActive: boolean
  onReportCompleted: () => void
}

function formatCreatedAt(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy HH:mm")
  } catch {
    return value
  }
}

export function PreparingReportsList({
  token,
  isActive,
  onReportCompleted,
}: PreparingReportsListProps) {
  const [reports, setReports] = useState<ReportSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const previousReportsRef = useRef<ReportSummary[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isFirstFetch = useRef(true)

  const fetchPreparing = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const [pendingRes, inProgressRes] = await Promise.all([
        listReports(token, { status: "PENDING" }, controller.signal),
        listReports(token, { status: "IN_PROGRESS" }, controller.signal),
      ])

      if (controller.signal.aborted) return

      if (pendingRes.status !== 200 && inProgressRes.status !== 200) {
        const body = pendingRes.data as ApiErrorResponse
        setErrorMessage(body.message ?? "Failed to load preparing reports.")
        setLoading(false)
        return
      }

      const pendingContent =
        pendingRes.status === 200
          ? (pendingRes.data as { content?: { reports?: ReportSummary[] } }).content?.reports ?? []
          : []
      const inProgressContent =
        inProgressRes.status === 200
          ? (inProgressRes.data as { content?: { reports?: ReportSummary[] } }).content?.reports ?? []
          : []

      const merged = [...pendingContent, ...inProgressContent]

      const prevIds = new Set(previousReportsRef.current.map((r) => r.reportId))
      const currentIds = new Set(merged.map((r) => r.reportId))

      const disappearedIds = [...prevIds].filter((id) => !currentIds.has(id))
      if (disappearedIds.length > 0) {
        disappearedIds.forEach(async (id) => {
          try {
            const detailRes = await getReportById(token, id)
            if (detailRes.status === 200) {
              const detail = (
                detailRes.data as { content?: { status?: string; errorMessage?: string } }
              ).content
              if (detail?.status === "COMPLETED") {
                toast.success(`Report-${id} is ready`)
                onReportCompleted()
              } else if (detail?.status === "FAILED") {
                toast.error(
                  `Report-${id} failed${detail.errorMessage ? `: ${detail.errorMessage}` : ""}`
                )
              }
            }
          } catch {
            // ignore individual report fetch errors
          }
        })
      }

      previousReportsRef.current = merged
      setReports(merged)
      setErrorMessage(null)
    } catch {
      if (controller.signal.aborted) return
      setErrorMessage("Failed to load preparing reports.")
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
        isFirstFetch.current = false
      }
    }
  }, [token, onReportCompleted])

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    isFirstFetch.current = true
    setLoading(true)
    fetchPreparing()

    intervalRef.current = setInterval(fetchPreparing, POLLING_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive, fetchPreparing])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (loading && isFirstFetch.current) {
    return (
      <Card>
        <CardContent className="max-w-full overflow-x-auto p-0">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>Report ID</TableHead>
                <TableHead>Range</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
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
          <Button variant="outline" size="sm" onClick={fetchPreparing}>
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
              <EmptyTitle>No reports being prepared</EmptyTitle>
              <EmptyDescription>
                No reports are being prepared. Use the bar above to generate one.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="max-w-full overflow-x-auto p-0">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Report ID</TableHead>
              <TableHead className="w-[220px]">Range</TableHead>
              <TableHead className="w-[180px]">Created</TableHead>
              <TableHead className="w-[160px]">Status</TableHead>
              <TableHead className="w-[160px]">Started</TableHead>
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
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(parseISO(report.createdAt), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
