import { InvestmentTradeSkeletonShell } from "@/components/components/investment-account/investment-skeleton-shells"
import { PageHeader } from "@/components/components/investment-account/page-header"

export default function InvestmentTradePage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Trade"
        description="Prepare buy and sell orders while reviewing selected stock details."
      />
      <InvestmentTradeSkeletonShell />
    </section>
  )
}
