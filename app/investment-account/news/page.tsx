import { InvestmentSingleCardSkeletonShell } from "@/components/components/investment-account/investment-skeleton-shells"
import { PageHeader } from "@/components/components/investment-account/page-header"

export default function InvestmentNewsPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Investment News"
        description="Review generated market news and account-level investment context."
      />
      <InvestmentSingleCardSkeletonShell
        title="Market News"
        description="News summaries and generated insight will appear here."
      />
    </section>
  )
}
