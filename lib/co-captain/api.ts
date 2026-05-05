import axios from "axios"
import { CO_CAPTAIN_API } from "@/lib/constants/api"
import type {
  AcceptDraftRequest,
  AcceptDraftResponse,
  ApiSuccessEnvelope,
  RejectDraftResponse,
  SendMessageRequest,
  SendMessageResponse,
} from "@/lib/co-captain/types"

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function refreshSession(token: string, signal?: AbortSignal) {
  return axios.post<ApiSuccessEnvelope>(
    CO_CAPTAIN_API.SESSION,
    null,
    { signal, headers: authHeaders(token), validateStatus: () => true },
  )
}

export async function sendMessage(
  token: string,
  request: SendMessageRequest,
  signal?: AbortSignal,
) {
  return axios.post<SendMessageResponse>(CO_CAPTAIN_API.MESSAGES, request, {
    signal,
    headers: authHeaders(token),
    validateStatus: () => true,
  })
}

export async function openStream(
  token: string,
  messageId: number,
  streamToken: string,
  signal?: AbortSignal,
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const url = new URL(CO_CAPTAIN_API.STREAM)
  url.searchParams.set("messageId", String(messageId))
  url.searchParams.set("streamToken", streamToken)

  const res = await fetch(url.toString(), {
    headers: authHeaders(token),
    signal,
  })

  if (!res.ok || !res.body) {
    throw new Error(`Stream failed: ${res.status}`)
  }

  return res.body.getReader()
}

export async function acceptDraft(
  token: string,
  artifactId: number,
  body?: AcceptDraftRequest,
  signal?: AbortSignal,
) {
  return axios.post<AcceptDraftResponse>(
    CO_CAPTAIN_API.ARTIFACT_ACCEPT(artifactId),
    body ?? null,
    { signal, headers: authHeaders(token), validateStatus: () => true },
  )
}

export async function rejectDraft(
  token: string,
  artifactId: number,
  signal?: AbortSignal,
) {
  return axios.post<RejectDraftResponse>(
    CO_CAPTAIN_API.ARTIFACT_REJECT(artifactId),
    null,
    { signal, headers: authHeaders(token), validateStatus: () => true },
  )
}
