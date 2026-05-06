"use client"

import Link from "next/link"
import { format } from "date-fns"
import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, PencilLine, XCircle } from "lucide-react"
import { toast } from "sonner"
import { RiArrowRightLine } from "@remixicon/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { mapBackendDebtsFieldErrors, toBackendDate, validateGetDebtForm } from "@/lib/debts-account/validation"
import { DEBT_CATEGORY_DISPLAY_MAP, isDebtCategory, type DebtCategory } from "@/lib/debts-account/constants"
import { acceptDraft, rejectDraft } from "@/lib/co-captain/api"
import type {
  ApiErrorEnvelope,
  Artifact,
  ArtifactRendererProps,
  DebtsDebtDraftPayload,
} from "@/lib/co-captain/types"
import { DebtsDebtDraftModal, type DebtsDebtDraftFieldErrors, type DebtsDebtDraftFormValues } from "./DebtsDebtDraftModal"

type PendingAction = "accept" | "reject" | null

function sanitizeAmountInput(value: string): string {
  const normalized = value.replace(/[^\d.]/g, "")
  const parts = normalized.split(".")
  if (parts.length <= 2) {
    return normalized
  }
  return `${parts[0]}.${parts.slice(1).join("")}`
}

function extractDatePart(value: string): string {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
  return match?.[1] ?? ""
}

function toDateInputValue(value: string): string {
  const datePart = extractDatePart(value)
  if (datePart) {
    return datePart
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return format(date, "yyyy-MM-dd")
}

function formatCardDate(value: string): string {
  const datePart = extractDatePart(value)
  const source = datePart || value
  const date = new Date(`${source}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
}

function trimDescription(value: string): string {
  const next = value.trim()
  if (!next) {
    return "—"
  }
  return next.length > 60 ? `${next.slice(0, 57)}...` : next
}

function parseDebtsDebtDraftPayload(payload: unknown): DebtsDebtDraftPayload {
  const raw = (payload ?? {}) as Partial<DebtsDebtDraftPayload>

  return {
    amount: typeof raw.amount === "number" && Number.isFinite(raw.amount) ? raw.amount : 0,
    category: typeof raw.category === "string" && isDebtCategory(raw.category) ? raw.category : "OTHER",
    transactionDate: typeof raw.transactionDate === "string" ? raw.transactionDate : "",
    description: typeof raw.description === "string" ? raw.description : "",
  }
}

function toFormValues(payload: DebtsDebtDraftPayload): DebtsDebtDraftFormValues {
  return {
    date: toDateInputValue(payload.transactionDate),
    amount: Number.isFinite(payload.amount) ? String(payload.amount) : "",
    category: payload.category,
    description: payload.description,
  }
}

function resolveCommittedResourceId(
  artifactCommittedId: number | undefined,
  responseData: unknown,
): number | undefined {
  if (typeof artifactCommittedId === "number") {
    return artifactCommittedId
  }

  if (!responseData || typeof responseData !== "object") {
    return undefined
  }

  const data = responseData as {
    committedResourceId?: unknown
    content?: { committedResourceId?: unknown }
  }

  if (typeof data.content?.committedResourceId === "number") {
    return data.content.committedResourceId
  }

  if (typeof data.committedResourceId === "number") {
    return data.committedResourceId
  }

  return undefined
}

function extractCommittedType(
  artifactCommittedType: string | undefined,
  responseData: unknown,
): string | undefined {
  if (artifactCommittedType) {
    return artifactCommittedType
  }

  if (!responseData || typeof responseData !== "object") {
    return undefined
  }

  const data = responseData as {
    committedResourceType?: unknown
    content?: { committedResourceType?: unknown }
  }

  if (typeof data.content?.committedResourceType === "string") {
    return data.content.committedResourceType
  }

  if (typeof data.committedResourceType === "string") {
    return data.committedResourceType
  }

  return undefined
}

function requiredFieldErrors(values: DebtsDebtDraftFormValues): DebtsDebtDraftFieldErrors {
  const errors: DebtsDebtDraftFieldErrors = {}

  if (!values.date) {
    errors.date = "Date is required."
  }

  if (!values.amount.trim()) {
    errors.amount = "Amount is required."
  }

  if (!values.category) {
    errors.category = "Category is required."
  }

  if (!values.description.trim()) {
    errors.description = "Description is required."
  }

  return errors
}

function isSameFormValues(left: DebtsDebtDraftFormValues, right: DebtsDebtDraftFormValues): boolean {
  return left.date === right.date
    && left.amount === right.amount
    && left.category === right.category
    && left.description === right.description
}

export function DebtsDebtDraftArtifact({ artifact, token, onUpdate }: ArtifactRendererProps<unknown>) {
  const [localArtifact, setLocalArtifact] = useState(artifact)
  const [open, setOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [formValues, setFormValues] = useState<DebtsDebtDraftFormValues>(() =>
    toFormValues(parseDebtsDebtDraftPayload(artifact.payload)),
  )
  const [fieldErrors, setFieldErrors] = useState<DebtsDebtDraftFieldErrors>({})
  const [cardError, setCardError] = useState("")
  const [modalError, setModalError] = useState("")
  const [hasLocalEdits, setHasLocalEdits] = useState(false)

  const sourcePayload = useMemo(
    () => parseDebtsDebtDraftPayload(artifact.payload),
    [artifact.payload],
  )
  const sourceFormValues = useMemo(() => toFormValues(sourcePayload), [sourcePayload])

  useEffect(() => {
    setLocalArtifact(artifact)
    setFormValues(sourceFormValues)
    setHasLocalEdits(false)
  }, [artifact, sourceFormValues])

  const payload = useMemo(() => parseDebtsDebtDraftPayload(localArtifact.payload), [localArtifact.payload])
  const acceptedResourceId = useMemo(() => {
    if (typeof localArtifact.committedResourceId === "number") {
      return localArtifact.committedResourceId
    }

    if (localArtifact.payload && typeof localArtifact.payload === "object") {
      const payloadValue = (localArtifact.payload as { committedResourceId?: unknown }).committedResourceId
      if (typeof payloadValue === "number") {
        return payloadValue
      }
    }

    return undefined
  }, [localArtifact.committedResourceId, localArtifact.payload])
  const amountText = formatAmount(payload.amount)
  const categoryLabel = DEBT_CATEGORY_DISPLAY_MAP[payload.category] ?? "Other"
  const dateText = formatCardDate(payload.transactionDate)
  const descriptionText = trimDescription(payload.description)

  const isDraft = localArtifact.status === "DRAFT"
  const isAccepted = localArtifact.status === "ACCEPTED"
  const isRejected = localArtifact.status === "REJECTED"
  const isPending = pendingAction !== null

  const liveValidationErrors = useMemo(
    () => ({
      ...validateGetDebtForm(formValues),
      ...requiredFieldErrors(formValues),
    }),
    [formValues],
  )

  const disableModalAccept = isPending || Object.keys(liveValidationErrors).length > 0

  function publishUpdate(nextArtifact: Artifact) {
    setLocalArtifact(nextArtifact)
    onUpdate?.(nextArtifact)
  }

  function setAcceptedState(responseData?: unknown, nextPayload?: unknown) {
    const committedResourceId = resolveCommittedResourceId(acceptedResourceId, responseData)
    const committedResourceType = extractCommittedType(localArtifact.committedResourceType, responseData)

    publishUpdate({
      ...localArtifact,
      status: "ACCEPTED",
      payload: nextPayload ?? localArtifact.payload,
      committedResourceId,
      committedResourceType,
    })
  }

  function setRejectedState() {
    publishUpdate({
      ...localArtifact,
      status: "REJECTED",
    })
  }

  function resetModalState() {
    setModalError("")
    setFieldErrors({})
  }

  function handleOpenModal() {
    if (!isDraft || isPending) {
      return
    }
    resetModalState()
    setOpen(true)
  }

  function applyEditsToDraft(nextValues: DebtsDebtDraftFormValues) {
    const nextAmount = Number(nextValues.amount)
    const nextPayload: DebtsDebtDraftPayload = {
      amount: Number.isFinite(nextAmount) ? nextAmount : payload.amount,
      category: (nextValues.category || payload.category) as DebtsDebtDraftPayload["category"],
      transactionDate: nextValues.date ? toBackendDate(nextValues.date) : payload.transactionDate,
      description: nextValues.description,
    }

    setLocalArtifact((prev) => ({
      ...prev,
      payload: nextPayload,
    }))
  }

  function handleFormChange(key: keyof DebtsDebtDraftFormValues, value: string) {
    const nextValue = key === "amount" ? sanitizeAmountInput(value) : value
    setFormValues((prev) => {
      const nextValues = { ...prev, [key]: nextValue }
      setHasLocalEdits(!isSameFormValues(nextValues, sourceFormValues))
      applyEditsToDraft(nextValues)
      return nextValues
    })

    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
    }

    if (modalError) {
      setModalError("")
    }
  }

  function buildSubmitPayload(): DebtsDebtDraftPayload {
    return {
      amount: Number(formValues.amount),
      category: (formValues.category as DebtCategory) || payload.category,
      transactionDate: toBackendDate(formValues.date),
      description: formValues.description.trim(),
    }
  }

  function handleStatusError(status: number, target: "card" | "modal", fallback: string) {
    const message = status === 401 ? "Your session has expired. Please log in again." : fallback

    if (target === "card") {
      setCardError(message)
      return
    }
    setModalError(message)
  }

  async function handleQuickAccept() {
    if (!token) {
      setCardError("Your session has expired. Please log in again.")
      return
    }

    setCardError("")
    setPendingAction("accept")

    try {
      let requestBody: { payload: Record<string, unknown> } | undefined

      if (hasLocalEdits) {
        const clientErrors = {
          ...validateGetDebtForm(formValues),
          ...requiredFieldErrors(formValues),
        }

        if (Object.keys(clientErrors).length > 0) {
          setFieldErrors(clientErrors)
          setModalError("Please correct the highlighted fields.")
          setOpen(true)
          return
        }

        requestBody = { payload: buildSubmitPayload() as Record<string, unknown> }
      }

      const response = await acceptDraft(token, localArtifact.id, requestBody)

      if (response.status === 200) {
        setAcceptedState(response.data, requestBody?.payload)
        setHasLocalEdits(false)
        return
      }

      if (response.status === 422) {
        const data = response.data as ApiErrorEnvelope
        setFieldErrors(mapBackendDebtsFieldErrors(data.fieldErrors))
        setModalError(data.message ?? "Please correct the highlighted fields.")
        setOpen(true)
        return
      }

      if (response.status === 409) {
        setAcceptedState(response.data, requestBody?.payload)
        setHasLocalEdits(false)
        toast.success("This draft was already accepted.")
        return
      }

      handleStatusError(response.status, "card", "Could not accept this draft. Please try again.")
    } catch {
      setCardError("Network error. Could not accept this draft.")
    } finally {
      setPendingAction(null)
    }
  }

  async function handleQuickReject() {
    if (!token) {
      setCardError("Your session has expired. Please log in again.")
      return
    }

    setCardError("")
    setPendingAction("reject")

    try {
      const response = await rejectDraft(token, localArtifact.id)

      if (response.status === 200 || response.status === 409) {
        setRejectedState()
        return
      }

      handleStatusError(response.status, "card", "Could not reject this draft. Please try again.")
    } catch {
      setCardError("Network error. Could not reject this draft.")
    } finally {
      setPendingAction(null)
    }
  }

  async function handleModalAccept() {
    if (!token) {
      setModalError("Your session has expired. Please log in again.")
      return
    }

    const clientErrors = {
      ...validateGetDebtForm(formValues),
      ...requiredFieldErrors(formValues),
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }

    setModalError("")
    setFieldErrors({})
    setPendingAction("accept")

    const editedPayload = buildSubmitPayload()

    try {
      const response = await acceptDraft(token, localArtifact.id, {
        payload: editedPayload as Record<string, unknown>,
      })

      if (response.status === 200) {
        setAcceptedState(response.data, editedPayload)
        setHasLocalEdits(false)
        setOpen(false)
        return
      }

      if (response.status === 422) {
        const data = response.data as ApiErrorEnvelope
        setFieldErrors(mapBackendDebtsFieldErrors(data.fieldErrors))
        setModalError(data.message ?? "Please correct the highlighted fields.")
        return
      }

      if (response.status === 409) {
        setAcceptedState(response.data, editedPayload)
        setHasLocalEdits(false)
        setOpen(false)
        toast.success("This draft was already accepted.")
        return
      }

      handleStatusError(response.status, "modal", "Could not accept this draft. Please try again.")
    } catch {
      setModalError("Network error. Could not accept this draft.")
    } finally {
      setPendingAction(null)
    }
  }

  async function handleModalReject() {
    if (!token) {
      setModalError("Your session has expired. Please log in again.")
      return
    }

    setModalError("")
    setPendingAction("reject")

    try {
      const response = await rejectDraft(token, localArtifact.id)
      if (response.status === 200 || response.status === 409) {
        setRejectedState()
        setOpen(false)
        return
      }

      handleStatusError(response.status, "modal", "Could not reject this draft. Please try again.")
    } catch {
      setModalError("Network error. Could not reject this draft.")
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <>
      <Card className={isRejected ? "opacity-70" : undefined}>
        <CardContent className="relative space-y-2 p-2.5">
          <Badge
            variant="outline"
            className="absolute top-1.5 right-1.5 flex items-center gap-1 border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-700 hover:bg-amber-500/10"
          >
            {isAccepted && typeof acceptedResourceId === "number"
              ? `Debts · #${acceptedResourceId}`
              : "Debts Draft"}
          </Badge>

          {isDraft ? (
            <>
              <div
                role="button"
                tabIndex={0}
                onClick={handleOpenModal}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    handleOpenModal()
                  }
                }}
                className="cursor-pointer pr-24 transition hover:opacity-90"
              >
                <div className="flex items-start gap-1.5">
                  <PencilLine className="mt-0.5 size-3.5 text-muted-foreground" />
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-[11px] font-semibold">
                      Draft new debt: <span className="text-red-600 dark:text-red-500">{amountText}</span>
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {categoryLabel} · {dateText} · &quot;{descriptionText}&quot;
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={handleQuickReject}
                  disabled={isPending}
                >
                  {pendingAction === "reject" ? <Spinner className="size-3.5" /> : null}
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleOpenModal}
                  disabled={isPending}
                >
                  Edit &amp; Review
                  <RiArrowRightLine />
                </Button>
                <Button
                  size="sm"
                  className="ml-auto h-7 text-xs"
                  onClick={handleQuickAccept}
                  disabled={isPending}
                >
                  {pendingAction === "accept" ? <Spinner className="size-3.5" /> : null}
                  Accept
                </Button>
              </div>

              {cardError ? <p className="text-xs text-destructive">{cardError}</p> : null}
            </>
          ) : null}

          {isAccepted ? (
            <div className="pr-24">
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="mt-0.5 size-3.5 text-emerald-600 dark:text-emerald-500" />
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-[11px] font-semibold">Logged: {amountText} new debt</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {categoryLabel} · {dateText}
                  </p>
                  {typeof acceptedResourceId === "number" ? (
                    <Link
                      href={`/debt-account/transactions/${acceptedResourceId}`}
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                    >
                      View transaction
                      <RiArrowRightLine />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {isRejected ? (
            <div className="pr-24">
              <div className="flex items-start gap-1.5">
                <XCircle className="mt-0.5 size-3.5 text-red-600/80 dark:text-red-500/80" />
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-[11px] font-semibold">Draft rejected</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {amountText} · {categoryLabel} · {dateText}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <DebtsDebtDraftModal
        open={open}
        onOpenChange={setOpen}
        values={formValues}
        fieldErrors={fieldErrors}
        globalError={modalError}
        pendingAction={pendingAction}
        disableAccept={disableModalAccept}
        onChange={handleFormChange}
        onAccept={handleModalAccept}
        onReject={handleModalReject}
      />
    </>
  )
}
