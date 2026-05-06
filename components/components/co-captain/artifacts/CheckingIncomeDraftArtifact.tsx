"use client"

import type { ArtifactRendererProps } from "@/lib/co-captain/types"
import { CheckingDraftArtifactBase } from "./CheckingDraftArtifactBase"

export function CheckingIncomeDraftArtifact(props: ArtifactRendererProps<unknown>) {
  return <CheckingDraftArtifactBase {...props} variant="income" />
}
