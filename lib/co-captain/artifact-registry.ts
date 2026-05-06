import type { FC } from "react"
import { AccountsDetailsArtifact } from "@/components/components/co-captain/artifacts/AccountsDetailsArtifact"
import { CheckingSummaryArtifact } from "@/components/components/co-captain/artifacts/CheckingSummaryArtifact"
import { CheckingTransactionListArtifact } from "@/components/components/co-captain/artifacts/CheckingTransactionListArtifact"
import { CheckingExpenseDraftArtifact } from "@/components/components/co-captain/artifacts/CheckingExpenseDraftArtifact"
import { CheckingIncomeDraftArtifact } from "@/components/components/co-captain/artifacts/CheckingIncomeDraftArtifact"
import { DebtsTransactionListArtifact } from "@/components/components/co-captain/artifacts/DebtsTransactionListArtifact"
import { DebtsSummaryArtifact } from "@/components/components/co-captain/artifacts/DebtsSummaryArtifact"
import { InvestmentPositionListArtifact } from "@/components/components/co-captain/artifacts/InvestmentPositionListArtifact"
import { InvestmentSummaryArtifact } from "@/components/components/co-captain/artifacts/InvestmentSummaryArtifact"
import { InvestmentNewsListArtifact } from "@/components/components/co-captain/artifacts/InvestmentNewsListArtifact"
import { InvestmentTransactionListArtifact } from "@/components/components/co-captain/artifacts/InvestmentTransactionListArtifact"
import { ServerTimeArtifact } from "@/components/components/co-captain/artifacts/ServerTimeArtifact"
import type { ArtifactRendererProps } from "@/lib/co-captain/types"

export const ARTIFACT_RENDERERS: Record<string, FC<ArtifactRendererProps<unknown>>> = {
  "accounts.details": AccountsDetailsArtifact,
  "checking.summary": CheckingSummaryArtifact,
  "checking.transaction_list": CheckingTransactionListArtifact,
  "checking.expense_draft": CheckingExpenseDraftArtifact,
  "checking.income_draft": CheckingIncomeDraftArtifact,
  "debts.summary": DebtsSummaryArtifact,
  "debts.transaction_list": DebtsTransactionListArtifact,
  "investment.position_list": InvestmentPositionListArtifact,
  "investments.positions": InvestmentPositionListArtifact,
  "investment.summary": InvestmentSummaryArtifact,
  "investments.summary": InvestmentSummaryArtifact,
  "investment.transaction_list": InvestmentTransactionListArtifact,
  "investments.transaction_list": InvestmentTransactionListArtifact,
  "investment.news": InvestmentNewsListArtifact,
  "investment.news_list": InvestmentNewsListArtifact,
  "investments.news": InvestmentNewsListArtifact,
  "server_time": ServerTimeArtifact,
}
