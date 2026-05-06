import type { FC } from "react"
import { AccountsDetailsArtifact } from "@/components/components/co-captain/artifacts/AccountsDetailsArtifact"
import { CheckingSummaryArtifact } from "@/components/components/co-captain/artifacts/CheckingSummaryArtifact"
import { CheckingTransactionListArtifact } from "@/components/components/co-captain/artifacts/CheckingTransactionListArtifact"
import type { ArtifactRendererProps } from "@/lib/co-captain/types"

export const ARTIFACT_RENDERERS: Record<string, FC<ArtifactRendererProps<unknown>>> = {
  "accounts.details": AccountsDetailsArtifact,
  "checking.summary": CheckingSummaryArtifact,
  "checking.transaction_list": CheckingTransactionListArtifact,
}
