"use client"

import { cn } from "@/lib/utils"

type StepIndicatorProps = {
  currentStep: 1 | 2 | 3
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${currentStep} of 3`}>
      {[1, 2, 3].map((step, index) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={cn(
              "size-2 rounded-full transition-colors",
              step <= currentStep ? "bg-primary" : "bg-muted"
            )}
            aria-hidden="true"
          />
          {index < 2 && <div className="h-px w-6 bg-border" aria-hidden="true" />}
        </div>
      ))}
    </div>
  )
}
