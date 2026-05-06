import type { FC } from "react"
import { AccountsDetailsArtifact } from "@/components/components/co-captain/artifacts/AccountsDetailsArtifact"
import { CheckingSummaryArtifact } from "@/components/components/co-captain/artifacts/CheckingSummaryArtifact"
import { CheckingTransactionListArtifact } from "@/components/components/co-captain/artifacts/CheckingTransactionListArtifact"
import { DebtsTransactionListArtifact } from "@/components/components/co-captain/artifacts/DebtsTransactionListArtifact"
import { DebtsSummaryArtifact } from "@/components/components/co-captain/artifacts/DebtsSummaryArtifact"
import { InvestmentPositionListArtifact } from "@/components/components/co-captain/artifacts/InvestmentPositionListArtifact"
import { ServerTimeArtifact } from "@/components/components/co-captain/artifacts/ServerTimeArtifact"
import type { ArtifactRendererProps } from "@/lib/co-captain/types"

export const ARTIFACT_RENDERERS: Record<string, FC<ArtifactRendererProps<unknown>>> = {
  "accounts.details": AccountsDetailsArtifact,
  "checking.summary": CheckingSummaryArtifact,
  "checking.transaction_list": CheckingTransactionListArtifact,
  "debts.summary": DebtsSummaryArtifact,
  "debts.transaction_list": DebtsTransactionListArtifact,
  "investment.position_list": InvestmentPositionListArtifact,
  "investments.positions": InvestmentPositionListArtifact,
  "server_time": ServerTimeArtifact,
}
