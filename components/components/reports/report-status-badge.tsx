import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { ReportStatus } from "@/lib/reports/types"

const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  PENDING: {
    label: "Pending",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10",
    icon: Clock,
  },
  IN_PROGRESS: {
    label: "In Progress",
    className:
      "border-blue-500/30 bg-blue-500/10 text-blue-700 hover:bg-blue-500/10",
    icon: Loader2,
  },
  COMPLETED: {
    label: "Completed",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10",
    icon: CheckCircle,
  },
  FAILED: {
    label: "Failed",
    className:
      "border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/10",
    icon: XCircle,
  },
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const { label, className, icon: Icon } = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={className}>
      <Icon className={`size-3${status === "IN_PROGRESS" ? " animate-spin" : ""}`} />
      {label}
    </Badge>
  )
}
