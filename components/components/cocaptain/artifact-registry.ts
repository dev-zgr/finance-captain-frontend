import type { ReactNode } from "react"

import type { ArtifactKind, ArtifactState } from "@/lib/cocaptain/types"

export type ArtifactRendererProps<P> = {
  artifactId: string
  kind: ArtifactKind
  state: ArtifactState
  payload: P
  onEdit?: (next: P) => void
}

export type ArtifactRenderer<P> = (props: ArtifactRendererProps<P>) => ReactNode

export const artifactRegistry = new Map<string, ArtifactRenderer<unknown>>()

// Concrete artifact renderers live next to their feature and self-register via registerArtifact(...).
export function registerArtifact(type: string, renderer: ArtifactRenderer<unknown>): void {
  artifactRegistry.set(type, renderer)
}
