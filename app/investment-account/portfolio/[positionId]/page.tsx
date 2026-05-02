import { InvestmentSingleCardSkeletonShell } from "@/components/components/investment-account/investment-skeleton-shells"
import { PageHeader } from "@/components/components/investment-account/page-header"

export default function InvestmentPositionDetailsPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Position Details"
        description="Review position-level performance, cost basis, and related activity."
      />
      <InvestmentSingleCardSkeletonShell
        title="Position Details"
        description="Selected position details will appear here."
        centered
        variant="detail"
      />
    </section>
  )
}
