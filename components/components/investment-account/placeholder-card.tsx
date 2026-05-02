import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type PlaceholderCardProps = {
  title: string
  description: string
  className?: string
  contentClassName?: string
  variant?: "chart" | "list" | "summary" | "actions" | "form" | "detail"
}

export function PlaceholderCard({
  title,
  description,
  className,
  contentClassName,
  variant = "list",
}: PlaceholderCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className={cn("flex flex-col gap-4", contentClassName)}>
        <PlaceholderBody variant={variant} />
      </CardContent>
    </Card>
  )
}

function PlaceholderBody({ variant }: { variant: PlaceholderCardProps["variant"] }) {
  if (variant === "chart") {
    return (
      <>
        <div className="flex items-end gap-3">
          <Skeleton className="h-28 flex-1" />
          <Skeleton className="h-40 flex-1" />
          <Skeleton className="h-24 flex-1" />
          <Skeleton className="h-36 flex-1" />
          <Skeleton className="h-32 flex-1" />
        </div>
        <Separator />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </>
    )
  }

  if (variant === "summary") {
    return (
      <div className="grid gap-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Separator />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      </div>
    )
  }

  if (variant === "actions") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    )
  }

  if (variant === "form") {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Separator />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    )
  }

  if (variant === "detail") {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-8 w-1/2" />
        <Separator />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
        <Skeleton className="h-24" />
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
    </div>
  )
}
