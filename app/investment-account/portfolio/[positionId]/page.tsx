"use client"

import { useParams } from "next/navigation"

import { InvestmentPositionDetailCard } from "@/components/components/investment-account/portfolio/investment-position-detail-card"

export default function InvestmentPositionDetailsPage() {
  const { positionId } = useParams<{ positionId: string }>()

  return (
    <section className="space-y-6">
      <InvestmentPositionDetailCard positionId={positionId} />
    </section>
  )
}
