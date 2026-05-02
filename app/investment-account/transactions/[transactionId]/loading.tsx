import { InvestmentSingleCardSkeletonShell } from "@/components/components/investment-account/investment-skeleton-shells"

export default function InvestmentTransactionDetailsLoading() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Transaction Details</h1>
      <InvestmentSingleCardSkeletonShell
        title="Transaction Details"
        description="Selected investment transaction details will appear here."
        variant="detail"
      />
    </section>
  )
}
