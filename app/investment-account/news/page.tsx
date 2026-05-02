import { InvestmentSingleCardSkeletonShell } from "@/components/components/investment-account/investment-skeleton-shells"

export default function InvestmentNewsPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Investment News</h1>
      <InvestmentSingleCardSkeletonShell
        title="Market News"
        description="News summaries and generated insight will appear here."
      />
    </section>
  )
}
