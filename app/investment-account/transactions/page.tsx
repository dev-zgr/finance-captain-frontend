import { InvestmentSingleCardSkeletonShell } from "@/components/components/investment-account/investment-skeleton-shells"
import { PageHeader } from "@/components/components/investment-account/page-header"

export default function InvestmentTransactionsPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Investment Transactions"
        description="Review deposits, withdrawals, buys, sells, and settlement history."
      />
      <InvestmentSingleCardSkeletonShell
        title="Transactions"
        description="Investment transaction rows and filters will appear here."
      />
    </section>
  )
}
