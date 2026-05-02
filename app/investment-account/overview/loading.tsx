import { InvestmentOverviewSkeletonShell } from "@/components/components/investment-account/investment-skeleton-shells"
import { PageHeader } from "@/components/components/investment-account/page-header"

export default function InvestmentOverviewLoading() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Investment Account Overview"
        description="Track performance, balances, holdings, market news, and recent investment activity."
      />
      <InvestmentOverviewSkeletonShell />
    </section>
  )
}
