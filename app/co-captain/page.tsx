"use client"

import { useSelector } from "react-redux"
import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout"
import { CoCaptainChat } from "@/components/components/co-captain/co-captain-chat"
import type { RootState } from "@/lib/store"

export default function CoCaptainPage() {
  const token = useSelector((state: RootState) => state.auth.content?.token ?? "")

  return (
    <AuthenticatedDashboardLayout fullHeight>
      <CoCaptainChat token={token} />
    </AuthenticatedDashboardLayout>
  )
}
