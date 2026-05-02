"use client"

import { CheckCircle2, Loader2 } from "lucide-react"

type SuccessOverlayProps = {
  status: "submitting" | "success"
  showFadeOut: boolean
  successMessage: string
}

export function SuccessOverlay({
  status,
  showFadeOut,
  successMessage,
}: SuccessOverlayProps) {
  return (
    <div
      className={`absolute inset-0 bg-white rounded-lg flex items-center justify-center z-50 transition-opacity duration-300 ${showFadeOut ? "opacity-0" : "opacity-100"}`}
    >
      {status === "submitting" && (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-12 animate-spin text-gray-700" />
          <p className="text-gray-700 text-sm font-medium">Processing...</p>
        </div>
      )}
      {status === "success" && (
        <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
          <div className="rounded-full bg-gray-200/50 p-4">
            <CheckCircle2 className="size-12 text-gray-800" strokeWidth={1.5} />
          </div>
          <p className="text-gray-700 text-sm font-medium">{successMessage}</p>
        </div>
      )}
    </div>
  )
}
