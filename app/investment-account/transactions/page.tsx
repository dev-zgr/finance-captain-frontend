import { InvestmentSingleCardSkeletonShell } from "@/components/components/investment-account/investment-skeleton-shells"

export default function InvestmentTransactionsPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Investment Transactions</h1>
      <InvestmentSingleCardSkeletonShell
        title="Transactions"
        description="Investment transaction rows and filters will appear here."
      />
    </section>
  )
}
