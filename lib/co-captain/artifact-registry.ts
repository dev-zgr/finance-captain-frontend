import type { FC } from "react"
import { AccountsDetailsArtifact } from "@/components/components/co-captain/artifacts/AccountsDetailsArtifact"
import type { ArtifactRendererProps } from "@/lib/co-captain/types"

export const ARTIFACT_RENDERERS: Record<string, FC<ArtifactRendererProps<unknown>>> = {
  "accounts.details": AccountsDetailsArtifact,
}
