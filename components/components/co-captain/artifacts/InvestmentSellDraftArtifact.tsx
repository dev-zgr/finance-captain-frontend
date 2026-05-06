"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { CheckCircle2, PencilLine, XCircle } from "lucide-react"
import { toast } from "sonner"
import { RiArrowRightLine } from "@remixicon/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { acceptDraft, rejectDraft } from "@/lib/co-captain/api"
import { extractInvestmentPositionsContent, getInvestmentPositionsWithoutBody, getStockDetails } from "@/lib/investment-account/api"
import type { RootState } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"
import type {
  ApiErrorEnvelope,
  Artifact,
  ArtifactRendererProps,
  InvestmentSellDraftPayload,
} from "@/lib/co-captain/types"
import {
  InvestmentSellDraftModal,
  type InvestmentSellDraftFieldErrors,
  type InvestmentSellDraftFormValues,
} from "./InvestmentSellDraftModal"

type PendingAction = "accept" | "reject" | null

const MAX_DESCRIPTION_LENGTH = 256
const TICKER_PATTERN = /^[A-Z]{1,6}$/

type PositionQuantity = {
  ticker: string
  quantity: number
}

function sanitizeQuantityInput(value: string): string {
  const normalized = value.replace(/[^\d.]/g, "")
  const parts = normalized.split(".")
  if (parts.length <= 2) {
    return normalized
  }
  return `${parts[0]}.${parts.slice(1).join("")}`
}

function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) {
    return "0"
  }
  if (Number.isInteger(value)) {
    return String(value)
  }
  return value.toFixed(6).replace(/\.?0+$/, "")
}

function trimDescription(value: string | null): string {
  const next = (value ?? "").trim()
  if (!next) {
    return ""
  }
  return next.length > 60 ? `${next.slice(0, 57)}...` : next
}

function parsePayload(payload: unknown): InvestmentSellDraftPayload {
  const raw = (payload ?? {}) as Partial<InvestmentSellDraftPayload>
  return {
    ticker: typeof raw.ticker === "string" ? raw.ticker.toUpperCase() : "",
    quantity: typeof raw.quantity === "number" && Number.isFinite(raw.quantity) ? raw.quantity : 0,
    priceSnapshot:
      typeof raw.priceSnapshot === "number" && Number.isFinite(raw.priceSnapshot)
        ? raw.priceSnapshot
        : null,
    estimatedTotal:
      typeof raw.estimatedTotal === "number" && Number.isFinite(raw.estimatedTotal)
        ? raw.estimatedTotal
        : null,
    description: typeof raw.description === "string" ? raw.description : null,
  }
}

function toFormValues(payload: InvestmentSellDraftPayload): InvestmentSellDraftFormValues {
  return {
    ticker: payload.ticker,
    quantity: Number.isFinite(payload.quantity) ? String(payload.quantity) : "",
    description: payload.description ?? "",
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

function mapFieldErrors(fieldErrors?: Record<string, string>): InvestmentSellDraftFieldErrors {
  const nextErrors: InvestmentSellDraftFieldErrors = {}

  Object.entries(fieldErrors ?? {}).forEach(([key, value]) => {
    const normalized = key.toLowerCase()
    if (normalized.includes("ticker")) {
      nextErrors.ticker = value
    }
    if (normalized.includes("quantity")) {
      nextErrors.quantity = value
    }
    if (normalized.includes("description")) {
      nextErrors.description = value
    }
  })

  return nextErrors
}

function validationErrorsFor(values: InvestmentSellDraftFormValues): InvestmentSellDraftFieldErrors {
  const errors: InvestmentSellDraftFieldErrors = {}

  const ticker = values.ticker.trim().toUpperCase()
  if (!ticker) {
    errors.ticker = "Ticker is required."
  } else if (!TICKER_PATTERN.test(ticker)) {
    errors.ticker = "Ticker must be 1-6 uppercase letters."
  }

  if (!values.quantity.trim()) {
    errors.quantity = "Quantity is required."
  } else {
    const quantity = Number(values.quantity)
    if (!Number.isFinite(quantity)) {
      errors.quantity = "Quantity must be a valid number."
    } else if (quantity <= 0) {
      errors.quantity = "Quantity must be greater than 0."
    } else {
      const decimals = values.quantity.split(".")[1]?.length ?? 0
      if (decimals > 6) {
        errors.quantity = "Quantity must have at most 6 decimal places."
      }
    }
  }

  if (values.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`
  }

  return errors
}

function isSameFormValues(left: InvestmentSellDraftFormValues, right: InvestmentSellDraftFormValues): boolean {
  return left.ticker === right.ticker
    && left.quantity === right.quantity
    && left.description === right.description
}

type ParsedStock = {
  companyName: string
  currentPrice: number | null
  percentChange: number | null
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function parseStockResponse(data: unknown): ParsedStock {
  if (!data || typeof data !== "object") {
    return { companyName: "", currentPrice: null, percentChange: null }
  }

  const wrapped = data as {
    content?: unknown
    data?: unknown
  }
  const root = (wrapped.content ?? wrapped.data ?? data) as Record<string, unknown>

  if (root && typeof root === "object" && root.profile && root.quote) {
    const profile = root.profile as Record<string, unknown>
    const quote = root.quote as Record<string, unknown>
    return {
      companyName: typeof profile.companyName === "string" ? profile.companyName : "",
      currentPrice: toFiniteNumber(quote.currentPrice),
      percentChange: toFiniteNumber(quote.percentChange),
    }
  }

  return {
    companyName: typeof root.companyName === "string" ? root.companyName : "",
    currentPrice: toFiniteNumber(root.currentPrice),
    percentChange: toFiniteNumber(root.percentChange) ?? toFiniteNumber(root.dayChangePercentage),
  }
}

export function InvestmentSellDraftArtifact({ artifact, token, onUpdate }: ArtifactRendererProps<unknown>) {
  const [localArtifact, setLocalArtifact] = useState(artifact)
  const [open, setOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [formValues, setFormValues] = useState<InvestmentSellDraftFormValues>(() =>
    toFormValues(parsePayload(artifact.payload)),
  )
  const [fieldErrors, setFieldErrors] = useState<InvestmentSellDraftFieldErrors>({})
  const [cardError, setCardError] = useState("")
  const [modalError, setModalError] = useState("")
  const [hasLocalEdits, setHasLocalEdits] = useState(false)

  const [livePrice, setLivePrice] = useState<number | null>(null)
  const [livePercentChange, setLivePercentChange] = useState<number | null>(null)
  const [liveCompanyName, setLiveCompanyName] = useState("")
  const [priceLoading, setPriceLoading] = useState(false)
  const [livePriceError, setLivePriceError] = useState("")
  const [highlightQuantityError, setHighlightQuantityError] = useState(false)
  const [positionsFallback, setPositionsFallback] = useState<PositionQuantity[]>([])
  const latestPriceRequestRef = useRef(0)

  const storePositions = useSelector((state: RootState) => state.investmentAccount.positions?.items ?? [])

  const sourcePayload = useMemo(() => parsePayload(artifact.payload), [artifact.payload])
  const sourceFormValues = useMemo(() => toFormValues(sourcePayload), [sourcePayload])

  useEffect(() => {
    setLocalArtifact(artifact)
    setFormValues(sourceFormValues)
    setHasLocalEdits(false)
    setLivePrice(sourcePayload.priceSnapshot)
    setLivePercentChange(null)
    setLiveCompanyName("")
    setLivePriceError("")
    setHighlightQuantityError(false)
  }, [artifact, sourceFormValues, sourcePayload.priceSnapshot])

  const payload = useMemo(() => parsePayload(localArtifact.payload), [localArtifact.payload])
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
  const descriptionText = trimDescription(payload.description)

  const isDraft = localArtifact.status === "DRAFT"
  const isAccepted = localArtifact.status === "ACCEPTED"
  const isRejected = localArtifact.status === "REJECTED"
  const isPending = pendingAction !== null

  const availablePositions = useMemo(() => {
    if (storePositions.length > 0) {
      return storePositions.map((position) => ({
        ticker: position.ticker.toUpperCase(),
        quantity: position.quantity,
      }))
    }
    return positionsFallback
  }, [positionsFallback, storePositions])

  const heldQuantity = useMemo(() => {
    const match = availablePositions.find((position) => position.ticker === formValues.ticker.toUpperCase())
    return match?.quantity ?? 0
  }, [availablePositions, formValues.ticker])

  const quantityNumber = useMemo(() => {
    const value = Number(formValues.quantity)
    return Number.isFinite(value) ? value : null
  }, [formValues.quantity])

  const estimatedTotal = useMemo(() => {
    if (quantityNumber === null || quantityNumber <= 0) {
      return null
    }

    const price = livePrice ?? payload.priceSnapshot
    if (price === null) {
      return payload.estimatedTotal
    }

    return quantityNumber * price
  }, [livePrice, payload.estimatedTotal, payload.priceSnapshot, quantityNumber])

  const holdingsWarningMessage = useMemo(() => {
    if (!formValues.ticker) {
      return ""
    }

    if (heldQuantity <= 0) {
      return `You don't hold any ${formValues.ticker}. Submission is still allowed and the server will validate.`
    }

    return `You entered more shares than you currently hold (${heldQuantity}). Submission is still allowed and the server will validate.`
  }, [formValues.ticker, heldQuantity])

  const showHoldingsWarning = useMemo(() => {
    if (!formValues.ticker || quantityNumber === null || quantityNumber <= 0) {
      return false
    }

    if (heldQuantity <= 0) {
      return true
    }

    return quantityNumber > heldQuantity
  }, [formValues.ticker, heldQuantity, quantityNumber])

  const liveValidationErrors = useMemo(() => validationErrorsFor(formValues), [formValues])
  const disableModalAccept = isPending || Object.keys(liveValidationErrors).length > 0

  const fetchLivePrice = useCallback(async (ticker: string) => {
    if (!token || !ticker) {
      return
    }

    const requestId = latestPriceRequestRef.current + 1
    latestPriceRequestRef.current = requestId
    setPriceLoading(true)
    setLivePriceError("")

    try {
      const response = await getStockDetails(token, ticker)
      if (latestPriceRequestRef.current !== requestId) {
        return
      }

      if (response.status !== 200) {
        setLivePriceError("Live price unavailable. Will use the latest available price at confirm time.")
        return
      }

      const parsed = parseStockResponse(response.data)
      setLiveCompanyName(parsed.companyName)
      setLivePercentChange(parsed.percentChange)
      if (parsed.currentPrice !== null) {
        setLivePrice(parsed.currentPrice)
      } else {
        setLivePriceError("Live price unavailable. Will use the latest available price at confirm time.")
      }
    } catch {
      if (latestPriceRequestRef.current !== requestId) {
        return
      }
      setLivePriceError("Live price unavailable. Will use the latest available price at confirm time.")
    } finally {
      if (latestPriceRequestRef.current === requestId) {
        setPriceLoading(false)
      }
    }
  }, [token])

  useEffect(() => {
    if (!open || !isDraft) {
      return
    }

    if (formValues.ticker) {
      void fetchLivePrice(formValues.ticker)
    }
  }, [fetchLivePrice, formValues.ticker, isDraft, open])

  useEffect(() => {
    if (!open || !token || !isDraft || storePositions.length > 0) {
      return
    }

    const authToken = token

    async function loadPositions() {
      const positionsResponse = await getInvestmentPositionsWithoutBody(authToken)
      const parsed = extractInvestmentPositionsContent(positionsResponse.data)
      if (parsed) {
        setPositionsFallback(
          parsed.positions.map((position) => ({
            ticker: position.ticker.toUpperCase(),
            quantity: position.quantity,
          })),
        )
      }
    }

    void loadPositions()
  }, [isDraft, open, storePositions.length, token])

  function publishUpdate(nextArtifact: Artifact) {
    setLocalArtifact(nextArtifact)
    onUpdate?.(nextArtifact)
  }

  function setAcceptedState(responseData?: unknown) {
    const committedResourceId = resolveCommittedResourceId(acceptedResourceId, responseData)
    const committedResourceType = extractCommittedType(localArtifact.committedResourceType, responseData)

    publishUpdate({
      ...localArtifact,
      status: "ACCEPTED",
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
    setHighlightQuantityError(false)
  }

  function handleOpenModal() {
    if (!isDraft || isPending) {
      return
    }
    resetModalState()
    setOpen(true)
  }

  function applyEditsToDraft(nextValues: InvestmentSellDraftFormValues) {
    const nextQuantity = Number(nextValues.quantity)
    const quantity = Number.isFinite(nextQuantity) ? nextQuantity : payload.quantity
    const ticker = nextValues.ticker.toUpperCase() || payload.ticker
    const snapshotPrice = livePrice ?? payload.priceSnapshot
    const nextPayload: InvestmentSellDraftPayload = {
      ticker,
      quantity,
      priceSnapshot: snapshotPrice,
      estimatedTotal: snapshotPrice !== null && Number.isFinite(quantity)
        ? snapshotPrice * quantity
        : payload.estimatedTotal,
      description: nextValues.description.trim() ? nextValues.description : null,
    }

    setLocalArtifact((prev) => ({
      ...prev,
      payload: nextPayload,
    }))
  }

  function handleFormChange(key: keyof InvestmentSellDraftFormValues, value: string) {
    const nextValue = key === "quantity"
      ? sanitizeQuantityInput(value)
      : key === "ticker"
        ? value.toUpperCase()
        : value

    setFormValues((prev) => {
      const nextValues = { ...prev, [key]: nextValue }
      setHasLocalEdits(!isSameFormValues(nextValues, sourceFormValues))
      applyEditsToDraft(nextValues)
      return nextValues
    })

    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
    }

    if (key === "quantity") {
      setHighlightQuantityError(false)
    }

    if (modalError) {
      setModalError("")
    }
  }

  function buildSubmitPayload(): { ticker: string; quantity: number; description: string | null } {
    return {
      ticker: formValues.ticker.trim().toUpperCase(),
      quantity: Number(formValues.quantity),
      description: formValues.description.trim() ? formValues.description.trim() : null,
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
      let requestBody: { payload: Record<string, unknown> }

      if (hasLocalEdits) {
        const clientErrors = validationErrorsFor(formValues)
        if (Object.keys(clientErrors).length > 0) {
          setFieldErrors(clientErrors)
          setModalError("Please correct the highlighted fields.")
          setOpen(true)
          return
        }

        requestBody = { payload: buildSubmitPayload() as Record<string, unknown> }
      } else {
        requestBody = {
          payload: {
            ticker: payload.ticker,
            quantity: payload.quantity,
            description: payload.description,
          } as Record<string, unknown>,
        }
      }

      const response = await acceptDraft(token, localArtifact.id, requestBody)

      if (response.status === 200) {
        setAcceptedState(response.data)
        setHasLocalEdits(false)
        return
      }

      if (response.status === 422) {
        const data = response.data as ApiErrorEnvelope
        setFieldErrors(mapFieldErrors(data.fieldErrors))
        setHighlightQuantityError(Boolean(data.fieldErrors?.quantity))
        setModalError(data.message ?? "Please correct the highlighted fields.")
        setOpen(true)
        return
      }

      if (response.status === 409) {
        setAcceptedState(response.data)
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

    const clientErrors = validationErrorsFor(formValues)
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }

    setModalError("")
    setFieldErrors({})
    setPendingAction("accept")

    const submitPayload = buildSubmitPayload()

    try {
      const response = await acceptDraft(token, localArtifact.id, {
        payload: submitPayload as Record<string, unknown>,
      })

      if (response.status === 200) {
        setAcceptedState(response.data)
        setHasLocalEdits(false)
        setOpen(false)
        return
      }

      if (response.status === 422) {
        const data = response.data as ApiErrorEnvelope
        setFieldErrors(mapFieldErrors(data.fieldErrors))
        setHighlightQuantityError(Boolean(data.fieldErrors?.quantity))
        setModalError(data.message ?? "Please correct the highlighted fields.")
        return
      }

      if (response.status === 409) {
        setAcceptedState(response.data)
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
            className="absolute top-1.5 right-1.5 flex items-center gap-1 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[10px] text-emerald-700 hover:bg-emerald-500/10"
          >
            {isAccepted && typeof acceptedResourceId === "number"
              ? `Investment · #${acceptedResourceId}`
              : "Investment Draft"}
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
                      Draft sell: {formatQuantity(payload.quantity)} <span className="font-mono">{payload.ticker || "—"}</span>
                    </p>
                    {payload.priceSnapshot === null ? (
                      <p className="truncate text-[10px] text-muted-foreground">
                        Live price will be applied at confirm time
                      </p>
                    ) : (
                      <p className="truncate text-[10px] text-muted-foreground">
                        ~{formatCurrency(payload.priceSnapshot)} per share · est. total{" "}
                        {payload.estimatedTotal === null
                          ? "—"
                          : formatCurrency(payload.estimatedTotal)}
                      </p>
                    )}
                    {descriptionText ? (
                      <p className="truncate text-[10px] text-muted-foreground">&quot;{descriptionText}&quot;</p>
                    ) : null}
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
                  <p className="truncate text-[11px] font-semibold">
                    Logged: sold {formatQuantity(payload.quantity)} <span className="font-mono">{payload.ticker || "—"}</span>
                  </p>
                  {typeof acceptedResourceId === "number" ? (
                    <Link
                      href={`/investment-account/transactions/${acceptedResourceId}`}
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
                    {formatQuantity(payload.quantity)} <span className="font-mono">{payload.ticker || "—"}</span>
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <InvestmentSellDraftModal
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
        livePrice={livePrice}
        livePercentChange={livePercentChange}
        companyName={liveCompanyName}
        priceLoading={priceLoading}
        onRefreshPrice={() => void fetchLivePrice(formValues.ticker)}
        estimatedTotal={estimatedTotal}
        heldQuantity={heldQuantity}
        livePriceError={livePriceError}
        showHoldingsWarning={showHoldingsWarning}
        highlightQuantityError={highlightQuantityError}
        holdingsWarningMessage={holdingsWarningMessage}
      />
    </>
  )
}
