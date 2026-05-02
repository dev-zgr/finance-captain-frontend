import type { ReactNode } from "react"

import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout"

export default function InvestmentAccountLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AuthenticatedDashboardLayout>
      {children}
    </AuthenticatedDashboardLayout>
  )
}
