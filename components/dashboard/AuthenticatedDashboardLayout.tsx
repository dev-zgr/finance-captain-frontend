"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/components/layoutComponents/app-sidebar";
import { Footer } from "@/components/layout/Footer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AuthenticatedDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = segment
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    return { href, label, isLast: index === segments.length - 1 };
  });

  return (
    <SidebarProvider>
      <AppSidebar className="z-30" />
      <SidebarInset className="min-h-svh font-sans">
        <div className="sticky top-2 z-10 flex items-center gap-2 px-2">
          <SidebarTrigger />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map(({ href, label, isLast }) => (
                <React.Fragment key={href}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href}>{label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast ? <BreadcrumbSeparator /> : null}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <main className="flex-1 p-4 md:p-6">{children}</main>
        <footer className="relative z-0 border-t bg-background">
          <div className="mx-auto w-full max-w-3xl px-4">
            <Footer />
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
