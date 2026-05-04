"use client"

import { useState } from "react"
import { toast } from "sonner"

import { fetchReportFile } from "@/lib/reports/api"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ExternalLink } from "lucide-react"

type OpenPdfButtonProps = {
  token: string
  reportId: number
}

export function OpenPdfButton({ token, reportId }: OpenPdfButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleOpen = async () => {
    setIsLoading(true)
    try {
      const response = await fetchReportFile(token, reportId)

      if (response.status === 409) {
        toast.error("Report is not ready yet. Please try again shortly.")
        return
      }

      if (response.status !== 200) {
        toast.error("Failed to open PDF. Please try again.")
        return
      }

      const objectUrl = URL.createObjectURL(response.data)
      window.open(objectUrl, "_blank")
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    } catch {
      toast.error("An unexpected error occurred while opening the PDF.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleOpen} disabled={isLoading}>
      {isLoading ? (
        <Spinner className="size-4" />
      ) : (
        <ExternalLink className="size-4" />
      )}
      Open PDF
    </Button>
  )
}
