"use client"

import Link from "next/link"
import {
  AlertTriangle,
  KeyRound,
  Mail,
  MapPinned,
  Phone,
  UserRound,
} from "lucide-react"
import { RiArrowRightLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Address = {
  firstLine: string
  secondLine: string
  state: string
  city: string
  zipCode: string
}

type AccountDetails = {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  address: Address | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  details: AccountDetails
}

function AccountRow({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="grid gap-1 border-b px-4 py-3 last:border-b-0">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        {label}
      </p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  )
}

export function AccountsDetailsModal({ open, onOpenChange, details }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-auto w-[60%] !max-w-6xl sm:!max-w-6xl"
        style={{ transform: "translateY(-20px)" }}
      >
        <DialogHeader>
          <DialogTitle>Account details</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-5 text-sky-600" />
                Profile
              </CardTitle>
              <CardDescription>Account Details</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <AccountRow label="First Name" value={`${details.firstName} ${details.lastName}`.trim()} icon={<UserRound className="size-3.5" />} />
              <AccountRow label="Email" value={details.email} icon={<Mail className="size-3.5" />} />
              <AccountRow label="Phone Number" value={details.phoneNumber} icon={<Phone className="size-3.5" />} />
              <AccountRow label="Password" value="••••••••••" icon={<KeyRound className="size-3.5" />} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPinned className="size-5 text-violet-600" />
                Address
              </CardTitle>
              <CardDescription>Address Details</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {details.address ? (
                <>
                  <AccountRow label="Address line 1" value={details.address.firstLine} icon={<MapPinned className="size-3.5" />} />
                  <AccountRow label="Address line 2" value={details.address.secondLine || "—"} icon={<MapPinned className="size-3.5" />} />
                  <AccountRow label="State" value={details.address.state} />
                  <AccountRow label="City" value={details.address.city} />
                  <AccountRow label="Zip code" value={details.address.zipCode} />
                </>
              ) : (
                <div className="px-4 py-5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-orange-500" />
                    No address on file.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button asChild onClick={() => onOpenChange(false)}>
            <Link href="/my-account" className="inline-flex items-center gap-1.5">
              Go to my account
              <RiArrowRightLine className="size-4" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
