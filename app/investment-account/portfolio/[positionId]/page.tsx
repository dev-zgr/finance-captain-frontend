import { InvestmentSingleCardSkeletonShell } from "@/components/components/investment-account/investment-skeleton-shells"

export default function InvestmentPositionDetailsPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Position Details</h1>
      <InvestmentSingleCardSkeletonShell
        title="Position Details"
        description="Selected position details will appear here."
        centered
        variant="detail"
      />
    </section>
  )
}
