"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"

const routeLabels: Record<string, string> = {
  overview: "Overview",
  portfolio: "Portfolio",
  news: "News",
  trade: "Trade",
  transactions: "Transactions",
}

function getInvestmentBreadcrumb(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  const section = segments[1] ?? "overview"
  const detailId = segments[2]

  if (section === "portfolio" && detailId) {
    return {
      parentHref: "/investment-account/portfolio",
      parentLabel: "Portfolio",
      currentLabel: "Position Details",
    }
  }

  if (section === "transactions" && detailId) {
    return {
      parentHref: "/investment-account/transactions",
      parentLabel: "Transactions",
      currentLabel: "Transaction Details",
    }
  }

  return {
    parentHref: "/investment-account/overview",
    parentLabel: "Investment Account",
    currentLabel: routeLabels[section] ?? "Overview",
  }
}

export default function InvestmentAccountLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const breadcrumb = getInvestmentBreadcrumb(pathname)

  return (
    <AuthenticatedDashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/investment-account/overview">Investment Account</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {breadcrumb.parentLabel !== "Investment Account" ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={breadcrumb.parentHref}>{breadcrumb.parentLabel}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              ) : null}
              <BreadcrumbItem>
                <BreadcrumbPage>{breadcrumb.currentLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Separator />
        </div>
        {children}
      </div>
    </AuthenticatedDashboardLayout>
  )
}
