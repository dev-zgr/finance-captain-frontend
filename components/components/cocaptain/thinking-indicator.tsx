import { Spinner } from "@/components/ui/spinner"

export function ThinkingIndicator() {
  return (
    <div className="inline-flex items-center justify-start gap-2 text-sm text-muted-foreground">
      <span className="ai-shimmer flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-primary-foreground">
        <Spinner className="text-primary-foreground" />
      </span>
      <span>Thinking...</span>
    </div>
  )
}
