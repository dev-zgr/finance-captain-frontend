"use client"

import { useSelector } from "react-redux"

import "@/components/components/cocaptain/artifacts"
import { CoCaptainChat } from "@/components/components/cocaptain/cocaptain-chat"
import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout"
import type { RootState } from "@/lib/store"

export default function CoCaptainPage() {
  const token = useSelector((state: RootState) => state.auth.content?.token ?? "")

  return (
    <AuthenticatedDashboardLayout>
      <section className="relative -m-4 flex min-h-[calc(100svh-4rem)] bg-background md:-m-6">
        <div className="relative z-10 flex w-full p-4 md:p-6">
          <CoCaptainChat token={token} />
        </div>
      </section>
    </AuthenticatedDashboardLayout>
  )
}
