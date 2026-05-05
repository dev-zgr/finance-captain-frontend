import type { ToolCallState } from "@/lib/co-captain/types"
import { ToolCallRow } from "./ToolCallRow"

type Props = {
  toolCalls: ToolCallState[]
}

export function ToolCallList({ toolCalls }: Props) {
  if (toolCalls.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {toolCalls.map((toolCall) => (
        <ToolCallRow key={toolCall.callId} toolCall={toolCall} />
      ))}
    </div>
  )
}
