"use client"

import { useState } from "react"
import { addDays, format, subDays } from "date-fns"
import { CalendarIcon, FileText, X } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { toast } from "sonner"

import { createReport } from "@/lib/reports/api"
import { validateDateRange, mapBackendReportFieldErrors } from "@/lib/reports/validation"
import type { ApiErrorResponse } from "@/lib/checking-account/types"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type ReportsTopBarProps = {
  token: string
  onReportQueued: () => void
}

function getDateRangeLabel(value?: DateRange): string {
  if (value?.from && value?.to) {
    return `${format(value.from, "MMM dd, y")} – ${format(value.to, "MMM dd, y")}`
  }
  if (value?.from) {
    return format(value.from, "MMM dd, y")
  }
  return "Pick a date range"
}

export function ReportsTopBar({ token, onReportQueued }: ReportsTopBarProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ startDate?: string; endDate?: string; range?: string }>({})
  const [popoverOpen, setPopoverOpen] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const hasSelection = Boolean(dateRange?.from || dateRange?.to)

  // When one end is chosen but the other isn't yet, constrain selectable dates to
  // ±29 days from the anchor (giving a max 30-day range) and cap at today.
  // Also restrict month navigation so the user can't browse outside the valid window.
  // react-day-picker sets to=from on the first click, so treat from===to as a single selection.
  const isSingleDateSelected =
    dateRange?.from != null &&
    (!dateRange.to || dateRange.from.getTime() === dateRange.to.getTime())
  const anchor = isSingleDateSelected ? dateRange!.from! : null
  const rangeMin = anchor ? subDays(anchor, 29) : undefined
  const rangeMax = anchor ? addDays(anchor, 29) : undefined
  const effectiveMax = rangeMax && rangeMax < today ? rangeMax : today

  const calendarDisabled = anchor
    ? (date: Date) => date < rangeMin! || date > effectiveMax
    : { after: today }

  const startMonth = anchor ? rangeMin : undefined
  const endMonth = anchor ? effectiveMax : undefined
  const errorMessage = fieldErrors.range ?? fieldErrors.startDate ?? fieldErrors.endDate

  const handleClear = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDateRange(undefined)
    setFieldErrors({})
  }

  const handleDateRangeChange = (next: DateRange | undefined) => {
    setDateRange(next)
    setFieldErrors({})
  }

  const handleGenerate = async () => {
    const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : ""
    const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : ""

    const errors = validateDateRange(startDate, endDate)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await createReport(token, { startDate, endDate })

      if (response.status === 202) {
        toast.success("Report generation queued — check the Preparing tab.")
        setDateRange(undefined)
        setFieldErrors({})
        onReportQueued()
        return
      }

      if (response.status === 400) {
        const body = response.data as ApiErrorResponse
        const mapped = mapBackendReportFieldErrors(body.fieldErrors)
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped)
        } else {
          setFieldErrors({ range: body.message ?? "Invalid request. Please check the date range." })
        }
        return
      }

      const body = response.data as ApiErrorResponse
      setFieldErrors({ range: body.message ?? "Failed to queue report. Please try again." })
    } catch {
      setFieldErrors({ range: "An unexpected error occurred. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !hasSelection && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon data-icon="inline-start" />
                  <span className="truncate">{getDateRangeLabel(dateRange)}</span>
                  {hasSelection ? (
                    <X
                      className="ml-auto size-4 text-muted-foreground hover:text-foreground"
                      aria-label="Clear date range"
                      onClick={handleClear}
                    />
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  disabled={calendarDisabled}
                  startMonth={startMonth}
                  endMonth={endMonth}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Range cannot exceed 30 days. End date cannot be in the future.
            </p>
            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isSubmitting || !hasSelection}
            className="sm:mt-0 mt-1"
          >
            {isSubmitting ? (
              <Spinner className="size-4" />
            ) : (
              <FileText className="size-4" />
            )}
            Generate Report
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
