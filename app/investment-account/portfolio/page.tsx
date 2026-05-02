import { InvestmentSingleCardSkeletonShell } from "@/components/components/investment-account/investment-skeleton-shells"

export default function InvestmentPortfolioPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Investment Portfolio</h1>
      <InvestmentSingleCardSkeletonShell
        title="Portfolio Positions"
        description="Position rows and portfolio controls will appear here."
      />
    </section>
  )
}
