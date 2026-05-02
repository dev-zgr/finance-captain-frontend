"use client"

import { useSelector } from "react-redux"
import { TradeForm } from "@/components/components/investment-account/trade"
import type { RootState } from "@/lib/store"

export default function InvestmentTradePage() {
  const token = useSelector((state: RootState) => state.auth.content?.token ?? "")

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Trade</h1>
      {token ? (
        <TradeForm token={token} />
      ) : (
        <div className="text-center text-muted-foreground">Loading...</div>
      )}
    </section>
  )
}
