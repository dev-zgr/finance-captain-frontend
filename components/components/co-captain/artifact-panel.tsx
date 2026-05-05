"use client"

import { useState } from "react"
import { RiCheckLine, RiCloseLine, RiFileTextLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { acceptDraft, rejectDraft } from "@/lib/co-captain/api"
import type { Artifact } from "@/lib/co-captain/types"

type Props = {
  artifacts: Artifact[]
  token: string
  onArtifactUpdate: (updated: Artifact) => void
}

function ArtifactCard({
  artifact,
  token,
  onUpdate,
}: {
  artifact: Artifact
  token: string
  onUpdate: (updated: Artifact) => void
}) {
  const [isPending, setIsPending] = useState(false)

  const isDraft = artifact.status === "DRAFT"

  async function handleAccept() {
    setIsPending(true)
    try {
      const res = await acceptDraft(token, artifact.id)
      if (res.status === 200 && res.data.content) {
        onUpdate({ ...artifact, status: "ACCEPTED" })
      }
    } finally {
      setIsPending(false)
    }
  }

  async function handleReject() {
    setIsPending(true)
    try {
      const res = await rejectDraft(token, artifact.id)
      if (res.status === 200) {
        onUpdate({ ...artifact, status: "REJECTED" })
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-3 text-sm">
      <div className="mb-1.5 flex items-start gap-2">
        <RiFileTextLine size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{artifact.type}</p>
          <p className="text-xs text-muted-foreground">
            {artifact.kind} · {artifact.status}
          </p>
        </div>
      </div>

      {isDraft && (
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="default"
            className="h-7 flex-1 text-xs"
            onClick={handleAccept}
            disabled={isPending}
          >
            <RiCheckLine size={13} />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 flex-1 text-xs"
            onClick={handleReject}
            disabled={isPending}
          >
            <RiCloseLine size={13} />
            Reject
          </Button>
        </div>
      )}

      {artifact.status === "ACCEPTED" && (
        <p className="mt-1.5 text-xs text-green-600">Accepted</p>
      )}
      {artifact.status === "REJECTED" && (
        <p className="mt-1.5 text-xs text-destructive">Rejected</p>
      )}
    </div>
  )
}

export function ArtifactPanel({ artifacts, token, onArtifactUpdate }: Props) {
  if (artifacts.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
        <RiFileTextLine size={32} className="opacity-40" />
        <p>Artifacts and drafts from Co-Captain will appear here.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      {artifacts.map((artifact) => (
        <ArtifactCard
          key={artifact.id}
          artifact={artifact}
          token={token}
          onUpdate={onArtifactUpdate}
        />
      ))}
    </div>
  )
}
