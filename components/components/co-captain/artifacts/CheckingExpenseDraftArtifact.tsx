"use client"

import type { ArtifactRendererProps } from "@/lib/co-captain/types"
import { CheckingDraftArtifactBase } from "./CheckingDraftArtifactBase"

export function CheckingExpenseDraftArtifact(props: ArtifactRendererProps<unknown>) {
  return <CheckingDraftArtifactBase {...props} variant="expense" />
}
