import { differenceInCalendarDays, parseISO } from "date-fns"

import { MAX_RANGE_DAYS } from "@/lib/reports/constants"

export interface DateRangeErrors {
  startDate?: string
  endDate?: string
  range?: string
}

export function validateDateRange(startDate: string, endDate: string): DateRangeErrors {
  if (!startDate) {
    return { startDate: "Start date is required." }
  }

  if (!endDate) {
    return { endDate: "End date is required." }
  }

  const start = parseISO(startDate)
  const end = parseISO(endDate)
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  if (start > end) {
    return { range: "Start date must be on or before end date." }
  }

  if (end > today) {
    return { endDate: "End date cannot be in the future." }
  }

  const diffDays = differenceInCalendarDays(end, start)
  if (diffDays >= MAX_RANGE_DAYS) {
    return { range: `Range cannot exceed ${MAX_RANGE_DAYS} days.` }
  }

  return {}
}

export function mapBackendReportFieldErrors(
  rawFieldErrors: Record<string, string> | undefined
): DateRangeErrors {
  if (!rawFieldErrors) return {}

  const mapped: DateRangeErrors = {}
  const keyMap: Record<string, keyof DateRangeErrors> = {
    startdate: "startDate",
    start_date: "startDate",
    startDate: "startDate",
    enddate: "endDate",
    end_date: "endDate",
    endDate: "endDate",
  }

  for (const [key, value] of Object.entries(rawFieldErrors)) {
    const mappedKey = keyMap[key] ?? keyMap[key.toLowerCase()]
    if (mappedKey) {
      mapped[mappedKey] = value
    }
  }

  return mapped
}
