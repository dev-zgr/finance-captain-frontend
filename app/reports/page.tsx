"use client"

import { useState } from "react"
import { useSelector } from "react-redux"

import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout"
import { ReportsTopBar } from "@/components/components/reports/reports-top-bar"
import { PreparingReportsList } from "@/components/components/reports/preparing-reports-list"
import { ReadyReportsTable } from "@/components/components/reports/ready-reports-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { RootState } from "@/lib/store"

export default function ReportsPage() {
  const token = useSelector((state: RootState) => state.auth.content?.token ?? "")
  const [activeTab, setActiveTab] = useState<"preparing" | "ready">("ready")
  const [readyRefreshKey, setReadyRefreshKey] = useState(0)

  const handleReportQueued = () => {
    setActiveTab("preparing")
  }

  const handleReportCompleted = () => {
    setReadyRefreshKey((k) => k + 1)
  }

  return (
    <AuthenticatedDashboardLayout>
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate AI-powered financial reports for any time range up to 30 days.
          </p>
        </div>

        <ReportsTopBar token={token} onReportQueued={handleReportQueued} />

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "preparing" | "ready")}
        >
          <TabsList>
            <TabsTrigger value="ready">Ready</TabsTrigger>
            <TabsTrigger value="preparing">Preparing</TabsTrigger>
          </TabsList>

          <TabsContent value="ready" className="mt-4">
            <ReadyReportsTable
              token={token}
              refreshKey={readyRefreshKey}
            />
          </TabsContent>

          <TabsContent value="preparing" className="mt-4">
            <PreparingReportsList
              token={token}
              isActive={activeTab === "preparing"}
              onReportCompleted={handleReportCompleted}
            />
          </TabsContent>
        </Tabs>
      </section>
    </AuthenticatedDashboardLayout>
  )
}
