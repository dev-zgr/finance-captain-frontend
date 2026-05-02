import { InvestmentOverviewClient } from "@/components/components/investment-account/overview/InvestmentOverviewClient"

export default function InvestmentOverviewPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Investment Account</h1>
      <InvestmentOverviewClient />
    </section>
  )
}
