import { PlaceholderCard } from "@/components/components/investment-account/placeholder-card"

export function InvestmentOverviewSkeletonShell() {
  return (
    <div className="grid grid-cols-12 gap-6">
      <PlaceholderCard
        title="Charts"
        description="Investment performance charts will appear here."
        variant="chart"
        className="col-span-8 max-lg:col-span-12"
      />
      <div className="col-span-4 flex flex-col gap-6 max-lg:col-span-12">
        <PlaceholderCard
          title="Summary"
          description="Account totals and position summary will appear here."
          variant="summary"
        />
        <PlaceholderCard
          title="Actions"
          description="Investment account actions will appear here."
          variant="actions"
        />
      </div>
      <PlaceholderCard
        title="Portfolio"
        description="Current positions will appear here."
        className="col-span-8 max-lg:col-span-12"
      />
      <PlaceholderCard
        title="News"
        description="Market news will appear here."
        className="col-span-4 max-lg:col-span-12"
      />
      <PlaceholderCard
        title="Transactions"
        description="Recent investment transactions will appear here."
        className="col-span-12"
      />
    </div>
  )
}

export function InvestmentTradeSkeletonShell() {
  return (
    <div className="grid grid-cols-2 gap-6">
      <PlaceholderCard
        title="Order Ticket"
        description="Trade inputs will appear here."
        variant="form"
        className="col-span-1 max-lg:col-span-2"
      />
      <PlaceholderCard
        title="Stock Details"
        description="Selected stock details will appear here."
        variant="detail"
        className="col-span-1 max-lg:col-span-2"
      />
    </div>
  )
}

export function InvestmentSingleCardSkeletonShell({
  title,
  description,
  centered = false,
  variant = "list",
}: {
  title: string
  description: string
  centered?: boolean
  variant?: "list" | "detail"
}) {
  return (
    <div className={centered ? "mx-auto w-full max-w-3xl" : undefined}>
      <PlaceholderCard title={title} description={description} variant={variant} />
    </div>
  )
}
