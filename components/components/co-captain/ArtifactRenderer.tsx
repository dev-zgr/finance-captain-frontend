import { ARTIFACT_RENDERERS } from "@/lib/co-captain/artifact-registry"
import type { Artifact, ArtifactRendererProps } from "@/lib/co-captain/types"
import { UnknownArtifact } from "./UnknownArtifact"

type Props = {
  artifact: Artifact
  token?: string
  onUpdate?: (next: Artifact) => void
}

export function ArtifactRenderer({ artifact, token, onUpdate }: Props) {
  const Renderer = ARTIFACT_RENDERERS[artifact.type]

  console.log("ArtifactRenderer - type:", artifact.type, "Renderer found:", !!Renderer, "Available renderers:", Object.keys(ARTIFACT_RENDERERS))

  if (!Renderer) {
    if (process.env.NODE_ENV === "production") {
      return null
    }
    return <UnknownArtifact type={artifact.type} />
  }

  return <Renderer {...({ artifact, token, onUpdate } as ArtifactRendererProps<unknown>)} />
}
