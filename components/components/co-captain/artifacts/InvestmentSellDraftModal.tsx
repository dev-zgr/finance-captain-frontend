"use client"

import { AlertCircle } from "lucide-react"
import { TickerCombobox } from "@/components/components/investment-account/trade/TickerCombobox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/utils"
import { StockPricePreview } from "./StockPricePreview"

type PendingAction = "accept" | "reject" | null

export type InvestmentSellDraftFormValues = {
  ticker: string
  quantity: string
  description: string
}

export type InvestmentSellDraftFieldErrors = Partial<Record<keyof InvestmentSellDraftFormValues, string>>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  values: InvestmentSellDraftFormValues
  fieldErrors: InvestmentSellDraftFieldErrors
  globalError: string
  pendingAction: PendingAction
  disableAccept: boolean
  onChange: (key: keyof InvestmentSellDraftFormValues, value: string) => void
  onAccept: () => void
  onReject: () => void
  livePrice: number | null
  livePercentChange: number | null
  companyName: string
  priceLoading: boolean
  onRefreshPrice: () => void
  estimatedTotal: number | null
  heldQuantity: number | null
  livePriceError: string
  showHoldingsWarning: boolean
  highlightQuantityError: boolean
  holdingsWarningMessage: string
}

const MAX_DESCRIPTION_LENGTH = 256

export function InvestmentSellDraftModal({
  open,
  onOpenChange,
  values,
  fieldErrors,
  globalError,
  pendingAction,
  disableAccept,
  onChange,
  onAccept,
  onReject,
  livePrice,
  livePercentChange,
  companyName,
  priceLoading,
  onRefreshPrice,
  estimatedTotal,
  heldQuantity,
  livePriceError,
  showHoldingsWarning,
  highlightQuantityError,
  holdingsWarningMessage,
}: Props) {
  const isPending = pendingAction !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Review draft sell</DialogTitle>
          <DialogDescription>
            Confirm or edit before submitting. Executed price is determined at submission time.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          {globalError ? (
            <div className="rounded-md border border-red-300 bg-red-100 px-4 py-2 text-sm text-red-800">
              {globalError}
            </div>
          ) : null}

          <StockPricePreview
            ticker={values.ticker}
            companyName={companyName}
            currentPrice={livePrice}
            percentChange={livePercentChange}
            isLoading={priceLoading}
            onRefresh={onRefreshPrice}
            disabled={isPending}
          />

          {livePriceError ? (
            <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{livePriceError}</AlertDescription>
            </Alert>
          ) : null}

          <Field data-invalid={Boolean(fieldErrors.ticker)}>
            <FieldLabel htmlFor="draft-investment-sell-ticker">Ticker</FieldLabel>
            <FieldContent>
              <TickerCombobox
                value={values.ticker}
                onSelect={(ticker) => onChange("ticker", ticker)}
                placeholder="Select ticker"
                disabled={isPending}
              />
              {fieldErrors.ticker ? <FieldError>{fieldErrors.ticker}</FieldError> : null}
            </FieldContent>
          </Field>

          <Field data-invalid={Boolean(fieldErrors.quantity)}>
            <FieldLabel htmlFor="draft-investment-sell-quantity">Quantity</FieldLabel>
            <FieldContent>
              <Input
                id="draft-investment-sell-quantity"
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={values.quantity}
                onChange={(event) => onChange("quantity", event.target.value)}
                aria-invalid={Boolean(fieldErrors.quantity)}
                disabled={isPending}
              />
              {fieldErrors.quantity ? <FieldError>{fieldErrors.quantity}</FieldError> : null}
            </FieldContent>
          </Field>

          <Field data-invalid={Boolean(fieldErrors.description)}>
            <FieldLabel htmlFor="draft-investment-sell-description">Description (optional)</FieldLabel>
            <FieldContent>
              <Input
                id="draft-investment-sell-description"
                type="text"
                placeholder="Add a short note"
                maxLength={MAX_DESCRIPTION_LENGTH}
                value={values.description}
                onChange={(event) => onChange("description", event.target.value)}
                aria-invalid={Boolean(fieldErrors.description)}
                disabled={isPending}
              />
              <FieldDescription className="text-xs">
                {values.description.length} / {MAX_DESCRIPTION_LENGTH}
              </FieldDescription>
              {fieldErrors.description ? <FieldError>{fieldErrors.description}</FieldError> : null}
            </FieldContent>
          </Field>

          <div className="space-y-1 rounded-md border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help underline decoration-dotted underline-offset-2">
                    Estimated total:
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Executed price is determined at confirm time and may differ slightly.
                </TooltipContent>
              </Tooltip>
              <span className="ml-2 font-medium text-foreground">
                {estimatedTotal === null ? "—" : formatCurrency(estimatedTotal)}
              </span>
            </p>
            <p className={`text-xs ${highlightQuantityError ? "font-medium text-red-700" : "text-muted-foreground"}`}>
              You hold:
              <span className="ml-2 font-medium text-foreground">
                {heldQuantity === null ? "—" : heldQuantity}
              </span>
              <span className="ml-1 font-mono text-foreground">{values.ticker || "—"}</span>
            </p>
          </div>

          {showHoldingsWarning ? (
            <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {holdingsWarningMessage}
              </AlertDescription>
            </Alert>
          ) : null}
        </FieldGroup>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={onReject} disabled={isPending}>
            {pendingAction === "reject" ? <Spinner className="size-3.5" /> : null}
            Reject
          </Button>

          <Button onClick={onAccept} disabled={disableAccept}>
            {pendingAction === "accept" ? <Spinner className="size-3.5" /> : null}
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
