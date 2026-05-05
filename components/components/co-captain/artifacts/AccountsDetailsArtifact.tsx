"use client"

import { useMemo, useState } from "react"
import { UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ArtifactRendererProps } from "@/lib/co-captain/types"
import { AccountsDetailsModal } from "./AccountsDetailsModal"

type AccountDetailsPayload = {
  firstName?: string
  "first name"?: string
  firstname?: string
  lastName?: string
  "last name"?: string
  lastname?: string
  email?: string
  phoneNumber?: string
  phonenumber?: string
  address?: {
    firstLine?: string
    firstline?: string
    secondLine?: string
    secondline?: string
    state?: string
    city?: string
    zipCode?: string
    zipcode?: string
  } | null
}

function readString(source: Record<string, unknown> | undefined | null, ...keys: string[]) {
  if (!source) {
    return ""
  }

  for (const key of keys) {
    const value = source[key]
    if (typeof value === "string") {
      return value
    }
  }

  return ""
}

export function AccountsDetailsArtifact({ artifact }: ArtifactRendererProps<unknown>) {
  const [open, setOpen] = useState(false)

  const details = useMemo(() => {
    const payload = (artifact.payload ?? {}) as AccountDetailsPayload
    const firstName = readString(payload as Record<string, unknown>, "firstName", "first name", "firstname")
    const lastName = readString(payload as Record<string, unknown>, "lastName", "last name", "lastname")
    const email = readString(payload as Record<string, unknown>, "email")
    const phoneNumber = readString(payload as Record<string, unknown>, "phoneNumber", "phonenumber")

    const rawAddress = payload.address && typeof payload.address === "object" ? payload.address : null

    const firstLine = readString(rawAddress as Record<string, unknown> | null, "firstLine", "firstline")
    const secondLine = readString(rawAddress as Record<string, unknown> | null, "secondLine", "secondline")
    const state = readString(rawAddress as Record<string, unknown> | null, "state")
    const city = readString(rawAddress as Record<string, unknown> | null, "city")
    const zipCode = readString(rawAddress as Record<string, unknown> | null, "zipCode", "zipcode")

    return {
      firstName,
      lastName,
      email,
      phoneNumber,
      address:
        rawAddress && (firstLine || secondLine || state || city || zipCode)
          ? { firstLine, secondLine, state, city, zipCode }
          : null,
    }
  }, [artifact.payload])

  const initials = `${details.firstName.charAt(0)}${details.lastName.charAt(0)}`.trim().toUpperCase() || "U"
  const fullName = `${details.firstName} ${details.lastName}`.trim() || "Unknown User"
  const contactParts = [details.email, details.phoneNumber].filter(
    (value): value is string => Boolean(value && value.trim()),
  )
  const contactLine = contactParts.length > 0 ? contactParts.join(" • ") : "—"
  const addressLine = details.address
    ? [
        details.address.firstLine,
        details.address.secondLine,
        details.address.city,
        details.address.state,
        details.address.zipCode,
      ]
        .filter((value): value is string => Boolean(value && value.trim()))
        .join(" • ") || "No address on file."
    : "No address on file."

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setOpen(true)
          }
        }}
        className="cursor-pointer transition hover:ring-1 hover:ring-primary/40"
      >
        <CardContent className="relative space-y-2 p-3">
          <Badge
            variant="outline"
            className="absolute top-2 right-2 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[10px] text-emerald-700 hover:bg-emerald-500/10"
          >
            <UserRound data-icon="inline-start" className="size-3" />
            Profile
          </Badge>

          <div className="flex items-start gap-2 pr-14">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-xs font-semibold">
                {fullName}
                <span className="ml-1.5 font-normal text-muted-foreground">• {contactLine}</span>
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{addressLine}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AccountsDetailsModal open={open} onOpenChange={setOpen} details={details} />
    </>
  )
}
