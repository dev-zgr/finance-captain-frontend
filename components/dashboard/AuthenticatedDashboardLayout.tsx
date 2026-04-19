"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/components/layoutComponents/app-sidebar";
import { Footer } from "@/components/layout/Footer";
import { Spinner } from "@/components/ui/spinner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useRequireAuth } from "@/lib/auth/use-require-auth";

export function AuthenticatedDashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthorized } = useRequireAuth();
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

  if (!isAuthorized) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar className="z-30" />
      <SidebarInset className="min-h-svh font-sans">
        <div className="sticky top-0 z-30 border-b bg-background px-2 shadow-sm">
          <div className="flex items-center gap-2 bg-background py-2">
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
