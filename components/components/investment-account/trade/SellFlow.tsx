"use client"

import { useState, useMemo } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { StepIndicator } from "./StepIndicator"
import { TickerCombobox } from "./TickerCombobox"
import type { PositionDTO, StockDetailsDTO } from "@/lib/investment-account/types"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { MAX_DESCRIPTION_LENGTH } from "@/lib/investment-account/trade-validation"
import { AlertTriangle, Info } from "lucide-react"

type SellFlowProps = {
  selectedTicker: string
  onTickerChange: (ticker: string) => void
  stockDetails: StockDetailsDTO | null
  isLoadingStock: boolean
  positions: PositionDTO[]
  onSubmit: (ticker: string, quantity: number, description: string | null) => Promise<void>
  isSubmitting: boolean
  error: string | null
  onErrorDismiss: () => void
}

export function SellFlow({
  selectedTicker,
  onTickerChange,
  stockDetails,
  onSubmit,
  isSubmitting,
  error,
  onErrorDismiss,
}: SellFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [quantity, setQuantity] = useState("")
  const [description, setDescription] = useState("")

  // Use userPosition from stockDetails if available
  const selectedPosition = stockDetails?.userPosition || null
  const maxQuantity = selectedPosition?.quantity || 0
  const hasSelectedPosition = selectedPosition !== null && maxQuantity > 0

  const totalProceeds = useMemo(() => {
    if (!stockDetails || !quantity) return 0
    return parseFloat(quantity) * stockDetails.currentPrice
  }, [stockDetails, quantity])

  const realizedPnl = useMemo(() => {
    if (!selectedPosition || !quantity) return 0
    const quantityNum = parseFloat(quantity)
    return ((stockDetails?.currentPrice || 0) - selectedPosition.averageBuyPrice) * quantityNum
  }, [selectedPosition, quantity, stockDetails])

  const quantityError = useMemo(() => {
    if (!quantity) return null
    const qtyNum = parseFloat(quantity)
    if (qtyNum < 1) return "Quantity must be at least 1"
    if (qtyNum > maxQuantity) return `Cannot exceed ${maxQuantity} shares`
    return null
  }, [quantity, maxQuantity])

  const step1Valid = selectedTicker !== "" && hasSelectedPosition
  const step2Valid = quantity !== "" && !quantityError

  const handleNext = () => {
    if (step === 1 && step1Valid) {
      setStep(2)
    } else if (step === 2 && step2Valid) {
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => (s === 1 ? 1 : (s - 1) as 1 | 2 | 3))
    }
  }

  const handleSubmit = async () => {
    try {
      await onSubmit(selectedTicker, parseFloat(quantity), description || null)
      setQuantity("")
      setDescription("")
      setStep(1)
    } catch {
      // Error is handled by parent component
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={onErrorDismiss}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <StepIndicator currentStep={step} totalSteps={3} steps={["Select Ticker", "Quantity", "Confirm"]} />

      {/* Step 1: Ticker Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="mb-3 font-semibold">Select a Stock to Sell</h3>
            <TickerCombobox
              value={selectedTicker}
              onSelect={onTickerChange}
              placeholder="Search for a ticker..."
            />
          </div>

          {selectedTicker && !hasSelectedPosition && (
            <Alert variant="default" className="border-muted-foreground/30 bg-muted/50">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-muted-foreground">
                You don&apos;t own any shares of {selectedTicker}.
              </AlertDescription>
            </Alert>
          )}

          {hasSelectedPosition && (
            <Card className="border-none bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shares Held:</span>
                    <span className="font-medium">{selectedPosition.quantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Cost:</span>
                    <span className="font-medium">{formatCurrency(selectedPosition.averageBuyPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost Basis:</span>
                    <span className="font-medium">{formatCurrency(selectedPosition.totalCostBasis)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button onClick={handleNext} disabled={!step1Valid} className="flex-1">
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Quantity */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="mb-3 font-semibold">Enter Quantity to Sell</h3>

            <div className="space-y-4">
              <Field>
                <FieldLabel>
                  Quantity <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    min="1"
                    max={maxQuantity}
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder={`Enter quantity (max: ${maxQuantity})`}
                    disabled={isSubmitting}
                  />
                </FieldContent>
                {quantityError && <FieldError>{quantityError}</FieldError>}
              </Field>

              {quantity && !quantityError && (
                <>
                  <Card className="border-none bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Price:</span>
                          <span className="font-medium">{formatCurrency(stockDetails?.currentPrice || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Proceeds:</span>
                          <span className="text-lg font-bold">{formatCurrency(totalProceeds)}</span>
                        </div>
                        <div className="border-t pt-3 flex justify-between">
                          <span className="font-semibold">Est. Realized P/L:</span>
                          <span
                            className={`text-lg font-bold ${
                              realizedPnl === 0
                                ? "text-gray-500"
                                : realizedPnl > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                            }`}
                          >
                            {formatCurrency(realizedPnl)} ({formatPercent((realizedPnl / (selectedPosition?.marketValue || 1)) * 100)})
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This will be sold from your positions and the proceeds will be added to your investment account.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting} className="flex-1">
              Back
            </Button>
            <Button onClick={handleNext} disabled={!step2Valid || isSubmitting} className="flex-1">
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="mb-3 font-semibold">Review & Confirm</h3>

            <Card className="border-none bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock:</span>
                    <span className="font-medium">{selectedTicker}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company:</span>
                    <span className="font-medium">{stockDetails?.companyName || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="font-medium">{quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Price:</span>
                    <span className="font-medium">{formatCurrency(stockDetails?.currentPrice || 0)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">Total Proceeds:</span>
                    <span className="text-lg font-bold">{formatCurrency(totalProceeds)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Realized P/L:</span>
                    <span className={`font-medium ${realizedPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(realizedPnl)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-4" />

            <Field>
              <FieldLabel>Description (Optional)</FieldLabel>
              <FieldContent>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
                  placeholder="Add a note about this trade..."
                  disabled={isSubmitting}
                  rows={3}
                />
                <FieldDescription>{description.length} / {MAX_DESCRIPTION_LENGTH}</FieldDescription>
              </FieldContent>
            </Field>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting} className="flex-1">
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Processing..." : "Confirm Sell"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
