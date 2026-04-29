"use client"

import { useParams } from "next/navigation"

import { DebtsTransactionDetailCard } from "@/components/components/debts-account/debts-transaction-detail-card"
import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout"

export default function DebtsTransactionDetailPage() {
  const { transactionId } = useParams<{ transactionId: string }>()

  return (
    <AuthenticatedDashboardLayout>
      <section>
        <DebtsTransactionDetailCard transactionId={transactionId} />
      </section>
    </AuthenticatedDashboardLayout>
  )
}
