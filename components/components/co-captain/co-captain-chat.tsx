"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { sendMessage, openStream } from "@/lib/co-captain/api"
import type { ArtifactData, ChatMessage, SseNamedEvent } from "@/lib/co-captain/types"
import { ChatMessageBubble } from "./chat-message-bubble"
import { ChatInput } from "./chat-input"
import { ArtifactPanel } from "./artifact-panel"

type Props = {
  token: string
}

const ROTATING_PHRASES = [
  { text: "tracks your spending habits", gradient: "from-blue-500 to-cyan-400" },
  { text: "analyzes your investments", gradient: "from-violet-500 to-purple-400" },
  { text: "spots unusual transactions", gradient: "from-rose-500 to-orange-400" },
  { text: "summarizes your monthly reports", gradient: "from-emerald-500 to-teal-400" },
  { text: "answers your financial questions", gradient: "from-indigo-500 to-blue-400" },
]

const PHRASE_GRADIENTS = [
  "linear-gradient(to right,#3b82f6,#22d3ee)",
  "linear-gradient(to right,#8b5cf6,#c084fc)",
  "linear-gradient(to right,#f43f5e,#fb923c)",
  "linear-gradient(to right,#10b981,#2dd4bf)",
  "linear-gradient(to right,#6366f1,#60a5fa)",
]


function RotatingPhrase() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % ROTATING_PHRASES.length), 2600)
    return () => clearInterval(id)
  }, [])

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={index}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45 }}
        className="text-2xl font-semibold"
        style={{
          background: PHRASE_GRADIENTS[index % PHRASE_GRADIENTS.length],
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {ROTATING_PHRASES[index].text}
      </motion.p>
    </AnimatePresence>
  )
}

function WelcomeScreen() {
  return (
    <div className="flex w-full flex-col items-center gap-10 text-center">
      {/* Hero title */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="flex flex-col items-center gap-4"
      >
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Your AI Financial Assistant
        </p>
        <h1
          className="leading-none tracking-tighter"
          style={{
            fontSize: "clamp(1.5rem, 14vw, 2rem)",
            fontWeight: 900,
            background: "linear-gradient(270deg,#2563eb,#7c3aed,#ec4899,#f59e0b,#10b981,#2563eb)",
            backgroundSize: "300% 300%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "gradient-shift 5s ease infinite",
          }}
        >
          Co-Captain
        </h1>
        <RotatingPhrase />
      </motion.div>
    </div>
  )
}

function parseSseChunk(chunk: string): SseNamedEvent[] {
  const results: SseNamedEvent[] = []
  for (const block of chunk.split(/\n\n+/)) {
    let eventName = ""
    let rawData = ""
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) eventName = line.slice(6).trim()
      else if (line.startsWith("data:")) rawData = line.slice(5).trim()
    }
    if (!eventName || !rawData) continue
    try {
      results.push({ event: eventName, data: JSON.parse(rawData) } as SseNamedEvent)
    } catch { /* skip malformed blocks */ }
  }
  return results
}

export function CoCaptainChat({ token }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [artifacts, setArtifacts] = useState<ArtifactData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => () => abortRef.current?.abort(), [])

  const handleSubmit = useCallback(
    async (text: string) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text }
      const assistantId = crypto.randomUUID()
      const assistantMsg: ChatMessage = { id: assistantId, role: "assistant", content: "" }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsLoading(true)

      try {
        const res = await sendMessage(token, { content: text }, controller.signal)
        if (res.status !== 200 && res.status !== 201) {
          throw new Error(res.data?.message ?? `Unexpected status ${res.status}`)
        }

        const { messageId, streamToken } = res.data.content!
        const reader = await openStream(token, messageId, streamToken, controller.signal)
        const decoder = new TextDecoder()

        outer: while (true) {
          const { done, value } = await reader.read()
          if (done) break

          for (const named of parseSseChunk(decoder.decode(value, { stream: true }))) {
            switch (named.event) {
              case "text_delta":
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: m.content + named.data.text } : m,
                  ),
                )
                break

              case "tool_start":
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, toolCalls: [...(m.toolCalls ?? []), { tool: named.data.tool, status: "running" }] }
                      : m,
                  ),
                )
                break

              case "tool_end":
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== assistantId) return m
                    return {
                      ...m,
                      toolCalls: (m.toolCalls ?? []).map((tc) =>
                        tc.tool === named.data.tool && tc.status === "running"
                          ? { ...tc, status: named.data.success ? "success" : "error", error: named.data.error }
                          : tc,
                      ),
                    }
                  }),
                )
                break

              case "artifact":
              case "draft":
                setArtifacts((prev) => {
                  const exists = prev.some((a) => a.id === named.data.id)
                  return exists
                    ? prev.map((a) => (a.id === named.data.id ? named.data : a))
                    : [...prev, named.data]
                })
                break

              case "error":
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: named.data.message } : m,
                  ),
                )
                reader.cancel()
                break outer

              case "done":
                reader.cancel()
                break outer
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        const errorText = err instanceof Error ? err.message : "Something went wrong. Please try again."
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: errorText } : m)),
        )
      } finally {
        setIsLoading(false)
      }
    },
    [token],
  )

  const handleArtifactUpdate = useCallback((updated: ArtifactData) => {
    setArtifacts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
  }, [])

  const hasMessages = messages.length > 0

  return (
    <div className="flex h-full">
      {/* Chat column */}
      <div className="flex flex-1 flex-col overflow-hidden p-4 md:p-6">
        {/* Page title — matches other pages */}
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Co-Captain</h1>

        {/* Single bordered container: messages + input */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
          {/* Message list — flex-col so the welcome div can flex-1 to fill height */}
          <div ref={scrollRef} className="flex flex-1 flex-col overflow-y-auto px-4 py-6 md:px-8">
            <AnimatePresence initial={false}>
              {!hasMessages && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-1 flex-col items-center justify-center"
                >
                  <WelcomeScreen />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              {messages.map((msg, i) => {
                const prevRole = i > 0 ? messages[i - 1]?.role : null
                const roleChanged = prevRole !== null && prevRole !== msg.role

                return (
                  <div
                    key={msg.id}
                    className={[
                      i === 0 ? "" : "mt-4",
                      roleChanged ? "pt-2" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <ChatMessageBubble
                      message={msg}
                      isStreaming={
                        isLoading &&
                        i === messages.length - 1 &&
                        msg.role === "assistant"
                      }
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Input inside the same box */}
          <ChatInput onSubmit={handleSubmit} disabled={isLoading} />
        </div>
      </div>

      {/* Artifact panel */}
      <div className="hidden w-72 shrink-0 flex-col border-l bg-background lg:flex">
        <div className="border-b px-4 py-3 text-sm font-semibold">Artifacts</div>
        <div className="flex-1 overflow-y-auto">
          <ArtifactPanel
            artifacts={artifacts}
            token={token}
            onArtifactUpdate={handleArtifactUpdate}
          />
        </div>
      </div>
    </div>
  )
}
