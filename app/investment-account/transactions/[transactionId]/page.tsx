"use client"

import { useParams } from "next/navigation"

import { InvestmentTransactionDetailCard } from "@/components/components/investment-account/transactions/investment-transaction-detail-card"

export default function InvestmentTransactionDetailsPage() {
  const { transactionId } = useParams<{ transactionId: string }>()

  return (
    <section className="space-y-6">
      <InvestmentTransactionDetailCard transactionId={transactionId} />
    </section>
  )
}
