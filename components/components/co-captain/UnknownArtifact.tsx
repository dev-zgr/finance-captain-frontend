import { Card, CardContent } from "@/components/ui/card"

type Props = {
  type: string
}

export function UnknownArtifact({ type }: Props) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-3 text-xs text-muted-foreground">
        unknown artifact type: {type}
      </CardContent>
    </Card>
  )
}
