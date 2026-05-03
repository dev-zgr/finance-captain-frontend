import type { ReactNode } from "react"

type AccountRowProps = {
  label: string
  value: string
  icon?: ReactNode
}

export function AccountRow({ label, value, icon }: AccountRowProps) {
  return (
    <div className="grid gap-1 border-b px-4 py-3 last:border-b-0">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        {label}
      </p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  )
}
