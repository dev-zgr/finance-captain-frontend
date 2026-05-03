"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"

import { CoCaptainComposer } from "@/components/components/cocaptain/composer"
import { CoCaptainEmptyState } from "@/components/components/cocaptain/empty-state"
import { MessageBubble } from "@/components/components/cocaptain/message-bubble"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader } from "@/components/ui/card"
import { clearPersistedAuth } from "@/lib/auth/session"
import {
  resetChat,
  streamChatMessage,
  StreamChatHttpError,
} from "@/lib/cocaptain/api"
import type {
  ChatMessage,
  CoCaptainApiSuccessResponse,
  CoCaptainArtifact,
  DraftActionOutcome,
  ResetChatResponseContent,
} from "@/lib/cocaptain/types"
import { logout } from "@/lib/slices/authSlice"

const INACTIVITY_TIMEOUT_MS = 5_000

type CoCaptainChatProps = {
  token: string
}

type ResetStatus = "idle" | "loading" | "ready" | "error"

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function createUserMessage(content: string): ChatMessage {
  return {
    id: uid("user"),
    role: "user",
    createdAt: new Date().toISOString(),
    segments: [{ id: uid("text"), type: "text", content }],
  }
}

function createAssistantMessage(id = uid("assistant")): ChatMessage {
  return {
    id,
    role: "assistant",
    createdAt: new Date().toISOString(),
    status: "streaming",
    segments: [],
  }
}

function finalizeAssistant(messages: ChatMessage[], assistantId: string, status: "completed" | "stopped") {
  return messages.map((message) => {
    if (message.id !== assistantId || message.role !== "assistant") {
      return message
    }

    return {
      ...message,
      status,
    }
  })
}

function appendAssistantText(messages: ChatMessage[], assistantId: string, delta: string): ChatMessage[] {
  return messages.map((message) => {
    if (message.id !== assistantId || message.role !== "assistant") {
      return message
    }

    const segments = [...message.segments]
    const last = segments.at(-1)

    if (last && last.type === "text") {
      segments[segments.length - 1] = {
        ...last,
        content: `${last.content}${delta}`,
      }
    } else {
      segments.push({
        id: uid("text"),
        type: "text",
        content: delta,
      })
    }

    return {
      ...message,
      segments,
    }
  })
}

function appendAssistantError(messages: ChatMessage[], assistantId: string, message: string): ChatMessage[] {
  return messages.map((item) => {
    if (item.id !== assistantId || item.role !== "assistant") {
      return item
    }

    return {
      ...item,
      segments: [
        ...item.segments,
        {
          id: uid("error"),
          type: "error",
          message,
        },
      ],
    }
  })
}

function appendToolCallSegment(
  messages: ChatMessage[],
  assistantId: string,
  payload: { toolCallId: string; toolName: string; arguments?: unknown },
): ChatMessage[] {
  return messages.map((message) => {
    if (message.id !== assistantId || message.role !== "assistant") {
      return message
    }

    return {
      ...message,
      segments: [
        ...message.segments,
        {
          id: uid("tool"),
          type: "tool-call",
          toolCallId: payload.toolCallId,
          toolName: payload.toolName,
          arguments: payload.arguments,
          status: "running",
        },
      ],
    }
  })
}

function applyToolResult(
  messages: ChatMessage[],
  payload: {
    toolCallId: string
    status: string
    result?: unknown
    errorMessage?: string
  },
): ChatMessage[] {
  return messages.map((message) => {
    if (message.role !== "assistant") {
      return message
    }

    return {
      ...message,
      segments: message.segments.map((segment) => {
        if (segment.type !== "tool-call" || segment.toolCallId !== payload.toolCallId) {
          return segment
        }

        return {
          ...segment,
          status: payload.status === "OK" ? "success" : "error",
          result: payload.result,
          errorMessage: payload.errorMessage,
        }
      }),
    }
  })
}

function appendArtifact(messages: ChatMessage[], assistantId: string, artifact: CoCaptainArtifact): ChatMessage[] {
  return messages.map((message) => {
    if (message.id !== assistantId || message.role !== "assistant") {
      return message
    }

    return {
      ...message,
      segments: [
        ...message.segments,
        {
          id: uid("artifact"),
          type: "artifact",
          artifact,
        },
      ],
    }
  })
}

function replaceArtifactInMessage(
  messages: ChatMessage[],
  messageId: string,
  artifact: CoCaptainArtifact,
): ChatMessage[] {
  return messages.map((message) => {
    if (message.id !== messageId || message.role !== "assistant") {
      return message
    }

    return {
      ...message,
      segments: message.segments.map((segment) => {
        if (segment.type !== "artifact") {
          return segment
        }

        if (segment.artifact.artifactId !== artifact.artifactId) {
          return segment
        }

        return {
          ...segment,
          artifact,
        }
      }),
    }
  })
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback
  }

  const payload = data as {
    message?: unknown
    fieldErrors?: Record<string, string>
  }

  if (typeof payload.fieldErrors?.content === "string") {
    return payload.fieldErrors.content
  }

  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message
  }

  return fallback
}

export function CoCaptainChat({ token }: CoCaptainChatProps) {
  const router = useRouter()
  const dispatch = useDispatch()

  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [resetStatus, setResetStatus] = useState<ResetStatus>("idle")
  const [resetError, setResetError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isWaitingFirstDelta, setIsWaitingFirstDelta] = useState(false)
  const [composerFocusSignal, setComposerFocusSignal] = useState(0)

  const streamAbortControllerRef = useRef<AbortController | null>(null)
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeAssistantIdRef = useRef<string | null>(null)

  const clearInactivityTimer = useCallback(() => {
    if (!inactivityTimerRef.current) {
      return
    }

    clearTimeout(inactivityTimerRef.current)
    inactivityTimerRef.current = null
  }, [])

  const endStream = useCallback(() => {
    setIsStreaming(false)
    setIsWaitingFirstDelta(false)
    setComposerFocusSignal((prev) => prev + 1)
    clearInactivityTimer()
    streamAbortControllerRef.current = null
    activeAssistantIdRef.current = null
  }, [clearInactivityTimer])

  const handleUnauthorized = useCallback(() => {
    clearPersistedAuth()
    dispatch(logout())
    router.replace("/login")
  }, [dispatch, router])

  const armInactivityTimer = useCallback(() => {
    clearInactivityTimer()

    inactivityTimerRef.current = setTimeout(() => {
      const activeAssistantId = activeAssistantIdRef.current
      if (!activeAssistantId) {
        endStream()
        return
      }

      setMessages((prev) =>
        appendAssistantError(prev, activeAssistantId, "Connection lost while streaming. Please try again."),
      )
      setMessages((prev) => finalizeAssistant(prev, activeAssistantId, "completed"))
      endStream()
    }, INACTIVITY_TIMEOUT_MS)
  }, [clearInactivityTimer, endStream])

  const initializeChat = useCallback(async () => {
    if (!token) {
      return
    }

    setResetStatus("loading")
    setResetError(null)
    setMessages([])
    setInput("")

    const response = await resetChat(token)

    if (response.status === 200) {
      const payload = response.data as CoCaptainApiSuccessResponse<ResetChatResponseContent>
      const nextChatSessionId = payload.content?.chatSessionId ?? null
      setChatSessionId(nextChatSessionId)
      setResetStatus("ready")
      return
    }

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    if (response.status === 500) {
      setResetStatus("error")
      setResetError("Could not initialize CoCaptain chat. Please retry.")
      return
    }

    setResetStatus("error")
    setResetError(extractErrorMessage(response.data, "Failed to initialize CoCaptain chat."))
  }, [handleUnauthorized, token])

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || !token || isStreaming || resetStatus !== "ready") {
        return
      }

      const userMessage = createUserMessage(trimmed)
      const provisionalAssistant = createAssistantMessage()
      activeAssistantIdRef.current = provisionalAssistant.id

      setMessages((prev) => [...prev, userMessage, provisionalAssistant])
      setInput("")
      setIsStreaming(true)
      setIsWaitingFirstDelta(true)

      const controller = new AbortController()
      streamAbortControllerRef.current = controller
      armInactivityTimer()

      try {
        await streamChatMessage(
          token,
          trimmed,
          {
            onChatStarted: (payload) => {
              armInactivityTimer()
              setChatSessionId(payload.chatSessionId)
              const oldId = activeAssistantIdRef.current
              if (!oldId) {
                return
              }

              setMessages((prev) =>
                prev.map((message) => {
                  if (message.id !== oldId || message.role !== "assistant") {
                    return message
                  }

                  return {
                    ...message,
                    id: payload.assistantMessageId,
                  }
                }),
              )
              activeAssistantIdRef.current = payload.assistantMessageId
            },
            onAssistantDelta: (payload) => {
              armInactivityTimer()
              setIsWaitingFirstDelta(false)

              const targetId = payload.messageId || activeAssistantIdRef.current
              if (!targetId) {
                return
              }

              setMessages((prev) => appendAssistantText(prev, targetId, payload.delta))
            },
            onToolCall: (payload) => {
              armInactivityTimer()
              const targetId = activeAssistantIdRef.current
              if (!targetId) {
                return
              }

              setMessages((prev) =>
                appendToolCallSegment(prev, targetId, {
                  toolCallId: payload.toolCallId,
                  toolName: payload.toolName,
                  arguments: payload.arguments,
                }),
              )
            },
            onToolResult: (payload) => {
              armInactivityTimer()
              setMessages((prev) =>
                applyToolResult(prev, {
                  toolCallId: payload.toolCallId,
                  status: payload.status,
                  result: payload.result,
                  errorMessage: payload.errorMessage,
                }),
              )
            },
            onArtifact: (payload) => {
              armInactivityTimer()
              const targetId = activeAssistantIdRef.current
              if (!targetId) {
                return
              }

              setMessages((prev) => appendArtifact(prev, targetId, payload.artifact))
            },
            onError: (payload) => {
              armInactivityTimer()
              const targetId = activeAssistantIdRef.current
              if (!targetId) {
                return
              }

              setMessages((prev) => appendAssistantError(prev, targetId, payload.message))
            },
            onChatCompleted: (payload) => {
              const targetId = activeAssistantIdRef.current ?? payload.assistantMessageId
              if (targetId) {
                setMessages((prev) => finalizeAssistant(prev, targetId, "completed"))
              }
              endStream()
            },
          },
          controller.signal,
        )

        const targetId = activeAssistantIdRef.current
        if (targetId) {
          setMessages((prev) => finalizeAssistant(prev, targetId, "completed"))
        }
        endStream()
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        if (error instanceof StreamChatHttpError) {
          if (error.status === 401) {
            handleUnauthorized()
            return
          }

          const targetId = activeAssistantIdRef.current
          if (targetId) {
            setMessages((prev) =>
              appendAssistantError(
                prev,
                targetId,
                error.status === 400
                  ? extractErrorMessage(error.data, "Validation error occurred.")
                  : extractErrorMessage(error.data, "Assistant stream failed."),
              ),
            )
            setMessages((prev) => finalizeAssistant(prev, targetId, "completed"))
          }

          endStream()
          return
        }

        const targetId = activeAssistantIdRef.current
        if (targetId) {
          setMessages((prev) =>
            appendAssistantError(prev, targetId, "Assistant stream failed."),
          )
          setMessages((prev) => finalizeAssistant(prev, targetId, "completed"))
        }
        endStream()
      }
    },
    [armInactivityTimer, endStream, handleUnauthorized, isStreaming, resetStatus, token],
  )

  useEffect(() => {
    if (!token) {
      return
    }

    void initializeChat()
  }, [initializeChat, token])

  useEffect(() => {
    return () => {
      streamAbortControllerRef.current?.abort()
      clearInactivityTimer()
    }
  }, [clearInactivityTimer])

  const composerDisabled = useMemo(() => {
    return resetStatus !== "ready" || Boolean(resetError)
  }, [resetError, resetStatus])

  const stopStream = useCallback(() => {
    if (!isStreaming) {
      return
    }

    streamAbortControllerRef.current?.abort()
    const targetId = activeAssistantIdRef.current
    if (targetId) {
      setMessages((prev) => appendAssistantError(prev, targetId, "Stopped by user."))
      setMessages((prev) => finalizeAssistant(prev, targetId, "stopped"))
    }
    endStream()
  }, [endStream, isStreaming])

  const handleDraftActionSuccess = useCallback(
    async (_messageId: string, _artifact: CoCaptainArtifact, outcome: DraftActionOutcome) => {
      const followUp =
        outcome === "accepted"
          ? "I accepted the draft. Please proceed."
          : "I rejected the draft."

      await sendMessage(followUp)
    },
    [sendMessage],
  )

  const activeAssistantId = activeAssistantIdRef.current

  return (
    <section className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border/70 bg-background/75 shadow-[0_0_0_1px_oklch(0.708_0_0_/_0.12)] backdrop-blur-sm">
      <CardHeader className="border-b py-3">
        {chatSessionId ? (
          <p className="font-mono text-xs text-muted-foreground">session: {chatSessionId}</p>
        ) : null}
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        {resetStatus === "error" ? (
          <div className="px-4 py-4">
            <Alert variant="destructive">
              <AlertTitle>Unable to start chat</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{resetError}</span>
                <Button type="button" variant="outline" onClick={() => void initializeChat()}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <CoCaptainEmptyState />
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  token={token}
                  message={message}
                  showThinking={Boolean(
                    isStreaming &&
                      isWaitingFirstDelta &&
                      message.role === "assistant" &&
                      message.id === activeAssistantId,
                  )}
                  onArtifactChange={(messageId, artifact) => {
                    setMessages((prev) => replaceArtifactInMessage(prev, messageId, artifact))
                  }}
                  onDraftActionSuccess={handleDraftActionSuccess}
                />
              ))}
            </div>
          )}
        </div>

        <CoCaptainComposer
          value={input}
          isStreaming={isStreaming}
          disabled={composerDisabled}
          autoFocus={resetStatus === "ready"}
          focusSignal={composerFocusSignal}
          onChange={setInput}
          onSend={() => void sendMessage(input)}
          onStop={stopStream}
        />
      </CardContent>
    </section>
  )
}
