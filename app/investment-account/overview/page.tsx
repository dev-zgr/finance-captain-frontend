import { InvestmentOverviewClient } from "@/components/components/investment-account/overview/InvestmentOverviewClient"
import { PageHeader } from "@/components/components/investment-account/page-header"

export default function InvestmentOverviewPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Investment Account Overview"
        description="Track performance, balances, holdings, market news, and recent investment activity."
      />
      <InvestmentOverviewClient />
    </section>
  )
}
