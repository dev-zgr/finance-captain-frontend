import { InvestmentOverviewSkeletonShell } from "@/components/components/investment-account/investment-skeleton-shells"

export default function InvestmentOverviewLoading() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Investment Account</h1>
      <InvestmentOverviewSkeletonShell />
    </section>
  )
}
