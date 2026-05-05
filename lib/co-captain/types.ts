// ── Request / Response envelopes ────────────────────────────────────────────

export type ApiSuccessEnvelope<T = undefined> = {
  message: string
  timestamp: string
  content?: T
}

export type ApiErrorEnvelope = {
  message: string
  timestamp: string
  fieldErrors?: Record<string, string>
  errorDetails?: string
}

// ── POST /messages ───────────────────────────────────────────────────────────

export type SendMessageRequest = {
  content: string
}

export type SendMessageContent = {
  messageId: number
  streamToken: string
}

export type SendMessageResponse = ApiSuccessEnvelope<SendMessageContent>

// ── Artifacts ────────────────────────────────────────────────────────────────

export type ArtifactKind = "GET" | "POST_DRAFT"

export type ArtifactStatus = "RENDERED" | "DRAFT" | "ACCEPTED" | "REJECTED" | "FAILED"

export type Artifact<T = unknown> = {
  id: number
  type: string
  kind: ArtifactKind
  status: ArtifactStatus
  payload: T
}

export type ArtifactRendererProps<T = unknown> = {
  artifact: Artifact<T>
  onUpdate?: (next: Artifact<T>) => void
}

export type ToolCallStatus = "running" | "ok" | "failed"

export type ToolCallState = {
  callId: string
  tool: string
  status: ToolCallStatus
  arguments?: unknown
  durationMs?: number
  errorCode?: string
  errorMessage?: string
}

// ── SSE events (named events over text/event-stream) ─────────────────────────

export type SseTextDeltaData = {
  text: string
}

export type SseToolStartData = {
  callId?: string
  tool: string
  arguments?: unknown
}

export type SseToolEndData = {
  callId?: string
  tool: string
  ok?: boolean
  success?: boolean
  durationMs?: number
  errorCode?: string
  errorMessage?: string
  error?: string
}

export type SseErrorData = {
  code: string
  message: string
}

export type SseDoneData = {
  messageId: number
}

export type SseNamedEvent =
  | { event: "text_delta"; data: SseTextDeltaData }
  | { event: "tool_start"; data: SseToolStartData }
  | { event: "tool_end"; data: SseToolEndData }
  | { event: "artifact"; data: Artifact }
  | { event: "draft"; data: Artifact }
  | { event: "error"; data: SseErrorData }
  | { event: "done"; data: SseDoneData }

// ── POST /artifacts/{id}/accept ───────────────────────────────────────────────

export type AcceptDraftRequest = {
  payload?: Record<string, unknown>
}

export type AcceptDraftContent = {
  artifactId: number
  status: "ACCEPTED"
  committedResourceType: string
  committedResourceId: number
}

export type AcceptDraftResponse = ApiSuccessEnvelope<AcceptDraftContent>

// ── POST /artifacts/{id}/reject ───────────────────────────────────────────────

export type RejectDraftContent = {
  artifactId: number
  status: "REJECTED"
}

export type RejectDraftResponse = ApiSuccessEnvelope<RejectDraftContent>

// ── Local UI types ────────────────────────────────────────────────────────────

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  toolCalls?: ToolCallState[]
  artifacts?: Artifact[]
}
