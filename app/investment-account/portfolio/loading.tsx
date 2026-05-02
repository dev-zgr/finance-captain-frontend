import { InvestmentSingleCardSkeletonShell } from "@/components/components/investment-account/investment-skeleton-shells"
import { PageHeader } from "@/components/components/investment-account/page-header"

export default function InvestmentPortfolioLoading() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Investment Portfolio"
        description="Review current positions, allocation, and portfolio-level performance."
      />
      <InvestmentSingleCardSkeletonShell
        title="Portfolio Positions"
        description="Position rows and portfolio controls will appear here."
      />
    </section>
  )
}
