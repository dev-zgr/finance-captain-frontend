import { ARTIFACT_RENDERERS } from "@/lib/co-captain/artifact-registry"
import type { Artifact, ArtifactRendererProps } from "@/lib/co-captain/types"
import { UnknownArtifact } from "./UnknownArtifact"

type Props = {
  artifact: Artifact
  onUpdate?: (next: Artifact) => void
}

export function ArtifactRenderer({ artifact, onUpdate }: Props) {
  const Renderer = ARTIFACT_RENDERERS[artifact.type]

  if (!Renderer) {
    if (process.env.NODE_ENV === "production") {
      return null
    }
    return <UnknownArtifact type={artifact.type} />
  }

  return <Renderer {...({ artifact, onUpdate } as ArtifactRendererProps<unknown>)} />
}
