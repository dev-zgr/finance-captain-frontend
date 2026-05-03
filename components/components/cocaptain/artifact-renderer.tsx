"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { artifactRegistry } from "@/components/components/cocaptain/artifact-registry"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { updateArtifactState } from "@/lib/cocaptain/api"
import type {
  CoCaptainArtifact,
  DraftActionOutcome,
  UpdateArtifactStateRequest,
} from "@/lib/cocaptain/types"
import { cn } from "@/lib/utils"

type ArtifactRendererProps = {
  token: string
  artifact: CoCaptainArtifact
  onArtifactChange: (artifact: CoCaptainArtifact) => void
  onDraftActionSuccess: (artifact: CoCaptainArtifact, outcome: DraftActionOutcome) => void
}

function resolvePatchErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback
  }

  const payload = data as {
    message?: unknown
    fieldErrors?: Record<string, string>
  }

  if (typeof payload.fieldErrors?.artifact === "string") {
    return payload.fieldErrors.artifact
  }

  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message
  }

  return fallback
}

function BadgeForState({ state }: { state: CoCaptainArtifact["state"] }) {
  if (state === "ACCEPTED") {
    return <Badge variant="secondary">Accepted</Badge>
  }

  if (state === "REJECTED") {
    return <Badge variant="outline">Rejected</Badge>
  }

  return <Badge variant="outline">Draft</Badge>
}

export function ArtifactRenderer({
  token,
  artifact,
  onArtifactChange,
  onDraftActionSuccess,
}: ArtifactRendererProps) {
  const Registered = artifactRegistry.get(artifact.type)

  const [localPayload, setLocalPayload] = useState<unknown>(artifact.payload)
  const [localState, setLocalState] = useState(artifact.state)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

  useEffect(() => {
    setLocalPayload(artifact.payload)
    setLocalState(artifact.state)
    setInlineError(null)
  }, [artifact.artifactId, artifact.payload, artifact.state])

  const renderedContent = useMemo(() => {
    if (!Registered) {
      return (
        <Card>
          <CardHeader className="py-2">
            <p className="text-sm font-medium">Artifact: {artifact.type}</p>
          </CardHeader>
          <CardContent className="space-y-2 py-3">
            <pre className="overflow-x-auto rounded-md border bg-muted/40 p-2 text-xs">
              {JSON.stringify(localPayload, null, 2)}
            </pre>
            <p className="text-xs text-muted-foreground">
              Renderer not registered for type: {artifact.type}
            </p>
          </CardContent>
        </Card>
      )
    }

    return Registered({
      artifactId: artifact.artifactId,
      kind: artifact.kind,
      state: localState,
      payload: localPayload,
      onEdit: setLocalPayload,
    })
  }, [Registered, artifact.artifactId, artifact.kind, artifact.type, localPayload, localState])

  if (artifact.kind === "DATA") {
    return <>{renderedContent}</>
  }

  const isPending = localState === "PENDING"

  const handleDecision = async (nextState: UpdateArtifactStateRequest["state"]) => {
    if (!isPending || isSubmitting) {
      return
    }

    const previousState = localState
    setIsSubmitting(true)
    setInlineError(null)
    setLocalState(nextState)

    try {
      const response = await updateArtifactState(token, artifact.artifactId, {
        state: nextState,
        payload: localPayload,
      })

      if (response.status === 200) {
        const payload = response.data as { content?: { artifact?: CoCaptainArtifact } }
        const updated = payload.content?.artifact ?? {
          ...artifact,
          state: nextState,
          payload: localPayload,
        }
        setLocalState(updated.state)
        setLocalPayload(updated.payload)
        onArtifactChange(updated)
        onDraftActionSuccess(
          updated,
          nextState === "ACCEPTED" ? "accepted" : "rejected",
        )
        return
      }

      if (response.status === 409) {
        const payload = response.data as { content?: { artifact?: CoCaptainArtifact } }
        const snapshot = payload.content?.artifact
        if (snapshot) {
          setLocalState(snapshot.state)
          setLocalPayload(snapshot.payload)
          onArtifactChange(snapshot)
        }
        toast.error("This draft is no longer pending.")
        return
      }

      if (response.status === 400) {
        setLocalState(previousState)
        setInlineError(resolvePatchErrorMessage(response.data, "Artifact update payload is invalid."))
        return
      }

      if (response.status === 403 || response.status === 404) {
        setLocalState(nextState)
        toast.error("This draft is no longer available.")
        return
      }

      setLocalState(previousState)
      setInlineError(resolvePatchErrorMessage(response.data, "Artifact update failed. Please try again."))
    } catch {
      setLocalState(previousState)
      setInlineError("Artifact update failed. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (localState === "REJECTED") {
    return (
      <Card className="opacity-80">
        <CardHeader className="flex flex-row items-center justify-between gap-2 py-2">
          <p className="text-sm">Draft artifact</p>
          <BadgeForState state={localState} />
        </CardHeader>
        <CardContent className="py-3 text-sm text-muted-foreground">
          This draft was rejected.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "overflow-hidden",
        localState === "PENDING" && "border-dashed",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 py-2">
        <p className="text-sm">Draft artifact</p>
        <BadgeForState state={localState} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3 py-3">
        {renderedContent}

        {inlineError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {inlineError}
          </div>
        ) : null}

        {isPending ? (
          <>
            <Separator />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDecision("REJECTED")}
                disabled={isSubmitting}
              >
                Reject
              </Button>
              <Button
                type="button"
                onClick={() => void handleDecision("ACCEPTED")}
                disabled={isSubmitting}
              >
                Accept
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
