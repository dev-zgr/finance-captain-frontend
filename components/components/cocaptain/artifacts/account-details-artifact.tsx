"use client"

import { ArrowRight, KeyRound, Mail, MapPinned, Phone, UserRound } from "lucide-react"

import { AccountRow } from "@/components/components/account/account-row"
import { registerArtifact, type ArtifactRenderer } from "@/components/components/cocaptain/artifact-registry"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { AccountDetailsArtifactPayload } from "@/lib/cocaptain/artifacts/account-details"

type RawRecord = Record<string, unknown>

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object"
}

function readString(source: RawRecord, key: string): string {
  const value = source[key]
  return typeof value === "string" ? value : ""
}

function readStringAny(source: RawRecord, keys: string[]): string {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "string") {
      return value
    }
  }

  return ""
}

function readBoolean(source: RawRecord, keys: string[]): boolean {
  for (const key of keys) {
    if (typeof source[key] === "boolean") {
      return source[key] as boolean
    }
  }

  return false
}

function parsePayload(payload: unknown): RawRecord | null {
  if (isRecord(payload)) {
    return payload
  }

  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload) as unknown
      return isRecord(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  return null
}

function normalizePayload(payload: unknown): AccountDetailsArtifactPayload {
  const root = parsePayload(payload)
  if (!root) {
    return {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      hasCheckingAccount: false,
      hasInvestmentAccount: false,
      address: null,
    }
  }

  const subject =
    (isRecord(root.user) && root.user) ||
    (isRecord(root.account) && root.account) ||
    (isRecord(root.accountDetails) && root.accountDetails) ||
    (isRecord(root.account_details) && root.account_details) ||
    root

  const rawAddress =
    (isRecord(subject.address) && subject.address) ||
    (isRecord(subject.accountAddress) && subject.accountAddress) ||
    (isRecord(subject.account_address) && subject.account_address) ||
    null

  const firstLine = rawAddress ? readString(rawAddress, "firstLine") || readString(rawAddress, "firstline") : ""
  const secondLine = rawAddress ? readString(rawAddress, "secondLine") || readString(rawAddress, "secondline") : ""
  const state = rawAddress ? readString(rawAddress, "state") : ""
  const city = rawAddress ? readString(rawAddress, "city") : ""
  const zipCode = rawAddress ? readString(rawAddress, "zipCode") || readString(rawAddress, "zipcode") : ""
  const firstName = readStringAny(subject, ["firstName", "first_name", "firstname", "first name", "name"])
  const lastName = readStringAny(subject, ["lastName", "last_name", "lastname", "last name", "surname", "familyName", "family_name"])

  return {
    firstName,
    lastName,
    email: readStringAny(subject, ["email", "emailAddress", "email_address"]),
    phoneNumber: readStringAny(subject, ["phoneNumber", "phone_number", "phonenumber", "phone"]),
    hasCheckingAccount: readBoolean(subject, ["hasCheckingAccount", "has_checking_account", "checkingAccount", "hasChecking"]),
    hasInvestmentAccount: readBoolean(subject, ["hasInvestmentAccount", "has_investment_account", "investmentAccount", "hasInvestment"]),
    address:
      rawAddress && (firstLine || secondLine || state || city || zipCode)
        ? {
            firstLine,
            secondLine,
            state,
            city,
            zipCode,
          }
        : null,
  }
}

const AccountDetailsArtifact: ArtifactRenderer<AccountDetailsArtifactPayload> = ({ payload }) => {
  const account = normalizePayload(payload)
  const displayName = [account.firstName.trim(), account.lastName.trim()].filter(Boolean).join(" ")
  const primaryParts = account.firstName.trim().split(/\s+/).filter(Boolean)
  const firstInitial = primaryParts[0]?.[0] ?? account.firstName.trim()[0] ?? ""
  const secondInitial =
    primaryParts[1]?.[0] ??
    account.lastName.trim()[0] ??
    account.firstName.trim()[1] ??
    ""
  const initials = `${firstInitial}${secondInitial}`.toUpperCase() || "NA"

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card
          role="button"
          tabIndex={0}
          className="cursor-pointer transition-shadow hover:shadow-md"
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/35 via-pink-500/35 to-sky-500/35 text-xs font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-sm font-semibold">{displayName || "—"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {account.email || "—"} · {account.phoneNumber || "—"}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={account.hasCheckingAccount ? "secondary" : "outline"}>Checking</Badge>
                <Badge variant={account.hasInvestmentAccount ? "secondary" : "outline"}>Investment</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Open for full profile and address details.</p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent
        className="h-auto w-[60%] !max-w-6xl sm:!max-w-6xl"
        style={{ transform: "translateY(-20px)" }}
      >
        <DialogHeader>
          <DialogTitle>Account Details</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="size-5 text-sky-600" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <AccountRow label="First Name" value={account.firstName} icon={<UserRound className="size-3.5" />} />
              <AccountRow label="Last Name" value={account.lastName} icon={<UserRound className="size-3.5" />} />
              <AccountRow label="Email" value={account.email} icon={<Mail className="size-3.5" />} />
              <AccountRow label="Phone Number" value={account.phoneNumber} icon={<Phone className="size-3.5" />} />
              <AccountRow label="Password" value="••••••••••" icon={<KeyRound className="size-3.5" />} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPinned className="size-5 text-violet-600" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {account.address ? (
                <>
                  <AccountRow
                    label="Address line 1"
                    value={account.address.firstLine}
                    icon={<MapPinned className="size-3.5" />}
                  />
                  <AccountRow
                    label="Address line 2"
                    value={account.address.secondLine}
                    icon={<MapPinned className="size-3.5" />}
                  />
                  <AccountRow label="State" value={account.address.state} />
                  <AccountRow label="City" value={account.address.city} />
                  <AccountRow label="Zip code" value={account.address.zipCode} />
                </>
              ) : (
                <div className="px-4 py-3 text-sm text-muted-foreground">No address on file.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              onClick={() => {
                window.location.href = "/my-account"
              }}
            >
              Go to my account
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

registerArtifact("account_details", AccountDetailsArtifact as ArtifactRenderer<unknown>)

export { AccountDetailsArtifact }
