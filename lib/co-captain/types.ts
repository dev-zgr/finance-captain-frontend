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

// ── SSE events (named events over text/event-stream) ─────────────────────────

export type SseTextDeltaData = {
  text: string
}

export type SseToolStartData = {
  tool: string
}

export type SseToolEndData = {
  tool: string
  success: boolean
  error?: string
}

export type ArtifactStatus = "RENDERED" | "DRAFT" | "ACCEPTED" | "REJECTED"

export type ArtifactData = {
  id: number
  type: string
  kind: string
  status: ArtifactStatus
  payload: Record<string, unknown>
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
  | { event: "artifact"; data: ArtifactData }
  | { event: "draft"; data: ArtifactData }
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

export type ToolCallRecord = {
  tool: string
  status: "running" | "success" | "error"
  error?: string
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  toolCalls?: ToolCallRecord[]
}
