import { InvestmentSingleCardSkeletonShell } from "@/components/components/investment-account/investment-skeleton-shells"
import { PageHeader } from "@/components/components/investment-account/page-header"

export default function InvestmentTransactionDetailsLoading() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Transaction Details"
        description="Review the selected investment transaction details."
      />
      <InvestmentSingleCardSkeletonShell
        title="Transaction Details"
        description="Selected investment transaction details will appear here."
        variant="detail"
      />
    </section>
  )
}
