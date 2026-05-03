import axios from "axios"

import { API_ENDPOINTS } from "@/lib/constants/api"
import type {
  ArtifactEventPayload,
  AssistantDeltaEventPayload,
  ChatCompletedEventPayload,
  ChatStartedEventPayload,
  CoCaptainApiErrorResponse,
  CoCaptainApiSuccessResponse,
  CoCaptainSseEventName,
  ResetChatResponseContent,
  SendMessageRequest,
  StreamErrorEventPayload,
  ToolCallEventPayload,
  ToolResultEventPayload,
  UpdateArtifactStateRequest,
  UpdateArtifactStateResponseContent,
} from "@/lib/cocaptain/types"

export type StreamChatHandlers = {
  onChatStarted?: (payload: ChatStartedEventPayload) => void
  onAssistantDelta?: (payload: AssistantDeltaEventPayload) => void
  onToolCall?: (payload: ToolCallEventPayload) => void
  onToolResult?: (payload: ToolResultEventPayload) => void
  onArtifact?: (payload: ArtifactEventPayload) => void
  onError?: (payload: StreamErrorEventPayload) => void
  onChatCompleted?: (payload: ChatCompletedEventPayload) => void
}

export class StreamChatHttpError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown) {
    super(`Streaming request failed with status ${status}`)
    this.name = "StreamChatHttpError"
    this.status = status
    this.data = data
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object"
}

function readString(value: Record<string, unknown>, key: string): string | null {
  const candidate = value[key]
  return typeof candidate === "string" ? candidate : null
}

function parseJsonData(rawData: string): unknown {
  try {
    return JSON.parse(rawData)
  } catch {
    return null
  }
}

function parseSseBlock(block: string): { event: string; data: string } | null {
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0 && !line.startsWith(":"))

  if (lines.length === 0) {
    return null
  }

  let event = ""
  const dataLines: string[] = []

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim()
      continue
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim())
    }
  }

  if (!event || dataLines.length === 0) {
    return null
  }

  return {
    event,
    data: dataLines.join("\n"),
  }
}

function dispatchSseEvent(
  event: string,
  data: unknown,
  handlers: StreamChatHandlers,
): void {
  switch (event as CoCaptainSseEventName) {
    case "chat.started": {
      if (!isRecord(data)) {
        return
      }

      const chatSessionId = readString(data, "chatSessionId")
      const userMessageId = readString(data, "userMessageId")
      const assistantMessageId = readString(data, "assistantMessageId")

      if (!chatSessionId || !userMessageId || !assistantMessageId) {
        return
      }

      handlers.onChatStarted?.({ chatSessionId, userMessageId, assistantMessageId })
      return
    }
    case "assistant.delta": {
      if (!isRecord(data)) {
        return
      }

      const messageId = readString(data, "messageId")
      const delta = readString(data, "delta")

      if (!messageId || delta === null) {
        return
      }

      handlers.onAssistantDelta?.({ messageId, delta })
      return
    }
    case "tool.call": {
      if (!isRecord(data)) {
        return
      }

      const toolCallId = readString(data, "toolCallId")
      const toolName = readString(data, "toolName")

      if (!toolCallId || !toolName) {
        return
      }

      handlers.onToolCall?.({
        ...data,
        toolCallId,
        toolName,
        arguments: data.arguments,
      })
      return
    }
    case "tool.result": {
      if (!isRecord(data)) {
        return
      }

      const toolCallId = readString(data, "toolCallId")
      const status = readString(data, "status")

      if (!toolCallId || !status) {
        return
      }

      handlers.onToolResult?.({
        ...data,
        toolCallId,
        status,
        result: data.result,
        errorMessage: readString(data, "errorMessage") ?? undefined,
      })
      return
    }
    case "artifact": {
      if (!isRecord(data)) {
        return
      }

      const candidate = isRecord(data.artifact) ? data.artifact : data

      const artifactId = readString(candidate, "artifactId")
      const kind = readString(candidate, "kind")
      const type = readString(candidate, "type")
      const state = readString(candidate, "state")

      if (!artifactId || !kind || !type || !state) {
        return
      }

      handlers.onArtifact?.({
        ...data,
        artifact: {
          artifactId,
          kind: kind as "DATA" | "DRAFT",
          type,
          version: Number(candidate.version ?? 1),
          state: state as "PUBLISHED" | "PENDING" | "ACCEPTED" | "REJECTED",
          payload: candidate.payload,
          producedByToolCallId:
            readString(candidate, "producedByToolCallId") ?? null,
        },
      })
      return
    }
    case "error": {
      if (!isRecord(data)) {
        return
      }

      const code = readString(data, "code") ?? "ERROR"
      const message = readString(data, "message")

      if (!message) {
        return
      }

      handlers.onError?.({
        ...data,
        code,
        message,
      })
      return
    }
    case "chat.completed": {
      if (!isRecord(data)) {
        return
      }

      const assistantMessageId = readString(data, "assistantMessageId")
      const finishReason = readString(data, "finishReason")

      if (!assistantMessageId || !finishReason) {
        return
      }

      handlers.onChatCompleted?.({
        ...data,
        assistantMessageId,
        finishReason,
      })
      return
    }
    default:
      return
  }
}

export async function resetChat(token: string) {
  return axios.post<
    CoCaptainApiSuccessResponse<ResetChatResponseContent> | CoCaptainApiErrorResponse
  >(API_ENDPOINTS.COCAPTAIN_CHAT_RESET, undefined, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    validateStatus: () => true,
  })
}

export async function updateArtifactState(
  token: string,
  artifactId: string,
  payload: UpdateArtifactStateRequest,
) {
  return axios.patch<
    CoCaptainApiSuccessResponse<UpdateArtifactStateResponseContent> | CoCaptainApiErrorResponse
  >(API_ENDPOINTS.COCAPTAIN_CHAT_ARTIFACT_BY_ID(artifactId), payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    validateStatus: () => true,
  })
}

export async function streamChatMessage(
  token: string,
  content: string,
  handlers: StreamChatHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const requestPayload: SendMessageRequest = { content }

  const response = await fetch(API_ENDPOINTS.COCAPTAIN_CHAT_MESSAGES, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(requestPayload),
    signal,
  })

  if (!response.ok) {
    let data: unknown = null

    try {
      data = await response.json()
    } catch {
      data = null
    }

    throw new StreamChatHttpError(response.status, data)
  }

  if (!response.body) {
    throw new Error("Streaming response body is not available.")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder("utf-8")

  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      buffer += decoder.decode()
      break
    }

    buffer += decoder.decode(value, { stream: true })

    const blocks = buffer.split(/\r?\n\r?\n/)
    buffer = blocks.pop() ?? ""

    for (const block of blocks) {
      const parsed = parseSseBlock(block)
      if (!parsed) {
        continue
      }

      const data = parseJsonData(parsed.data)
      if (data === null) {
        continue
      }

      dispatchSseEvent(parsed.event, data, handlers)
    }
  }

  if (buffer.trim()) {
    const parsed = parseSseBlock(buffer)
    if (parsed) {
      const data = parseJsonData(parsed.data)
      if (data !== null) {
        dispatchSseEvent(parsed.event, data, handlers)
      }
    }
  }
}
