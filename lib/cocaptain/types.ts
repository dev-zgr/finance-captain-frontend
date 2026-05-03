export type CoCaptainApiErrorResponse = {
  message?: string
  timestamp?: string
  errorDetails?: string
  fieldErrors?: Record<string, string>
}

export type CoCaptainApiSuccessResponse<T> = {
  message?: string
  timestamp?: string
  content?: T
}

export type ResetChatResponseContent = {
  chatSessionId: string
}

export type SendMessageRequest = {
  content: string
}

export type ChatCompletedFinishReason = "STOP" | "ERROR" | string

export type ArtifactKind = "DATA" | "DRAFT"
export type ArtifactState = "PUBLISHED" | "PENDING" | "ACCEPTED" | "REJECTED"

export type CoCaptainArtifact = {
  artifactId: string
  kind: ArtifactKind
  type: string
  version: number
  state: ArtifactState
  payload: unknown
  producedByToolCallId: string | null
}

export type UpdateArtifactStateRequest = {
  state: "ACCEPTED" | "REJECTED"
  payload?: unknown
}

export type UpdateArtifactStateResponseContent = {
  artifact: CoCaptainArtifact
}

export type ChatStartedEventPayload = {
  chatSessionId: string
  userMessageId: string
  assistantMessageId: string
}

export type AssistantDeltaEventPayload = {
  messageId: string
  delta: string
}

export type ToolCallEventPayload = {
  toolCallId: string
  toolName: string
  arguments?: unknown
  [key: string]: unknown
}

export type ToolResultEventPayload = {
  toolCallId: string
  status: "OK" | "ERROR" | string
  result?: unknown
  errorMessage?: string
  [key: string]: unknown
}

export type ArtifactEventPayload = {
  artifact: CoCaptainArtifact
  [key: string]: unknown
}

export type StreamErrorEventPayload = {
  code: string
  message: string
  [key: string]: unknown
}

export type ChatCompletedEventPayload = {
  assistantMessageId: string
  finishReason: ChatCompletedFinishReason
  [key: string]: unknown
}

export type CoCaptainSseEventName =
  | "chat.started"
  | "assistant.delta"
  | "tool.call"
  | "tool.result"
  | "artifact"
  | "error"
  | "chat.completed"

export type CoCaptainStreamEvent = {
  event: CoCaptainSseEventName | string
  data: unknown
}

export type ToolCallStatus = "running" | "success" | "error"

export type AssistantTextSegment = {
  id: string
  type: "text"
  content: string
}

export type AssistantToolCallSegment = {
  id: string
  type: "tool-call"
  toolCallId: string
  toolName: string
  arguments?: unknown
  status: ToolCallStatus
  result?: unknown
  errorMessage?: string
}

export type AssistantArtifactSegment = {
  id: string
  type: "artifact"
  artifact: CoCaptainArtifact
}

export type AssistantErrorSegment = {
  id: string
  type: "error"
  message: string
}

export type AssistantSegment =
  | AssistantTextSegment
  | AssistantToolCallSegment
  | AssistantArtifactSegment
  | AssistantErrorSegment

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  createdAt: string
  status?: "streaming" | "completed" | "stopped"
  segments: AssistantSegment[]
}

export type DraftActionOutcome = "accepted" | "rejected"
