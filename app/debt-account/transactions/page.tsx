"use client"

import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout"
import { DebtsTransactionsTable } from "@/components/components/debts-account/debts-transactions-table"

export default function DebtAccountTransactionsPage() {
  return (
    <AuthenticatedDashboardLayout>
      <section>
        <DebtsTransactionsTable />
      </section>
    </AuthenticatedDashboardLayout>
  )
}
