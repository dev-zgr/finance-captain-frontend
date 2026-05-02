import { InvestmentTradeSkeletonShell } from "@/components/components/investment-account/investment-skeleton-shells"

export default function InvestmentTradeLoading() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Trade</h1>
      <InvestmentTradeSkeletonShell />
    </section>
  )
}
