"use client"

import { cn } from "@/lib/utils"

type StepIndicatorProps = {
  currentStep: number
  totalSteps: number
  steps?: string[]
}

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1
          const isActive = stepNumber === currentStep
          const isComplete = stepNumber < currentStep

          return (
            <div key={i} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isComplete && "bg-green-600 text-white",
                  !isActive && !isComplete && "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? "✓" : stepNumber}
              </div>

              {i < totalSteps - 1 && (
                <div
                  className={cn(
                    "h-1 w-8 transition-colors",
                    isComplete ? "bg-green-600" : "bg-muted"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {steps && (
        <div>
          <p className="text-sm font-medium">
            Step {currentStep} of {totalSteps}: {steps[currentStep - 1]}
          </p>
        </div>
      )}
    </div>
  )
}
