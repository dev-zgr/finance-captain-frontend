"use client";

import React from "react";

import { AppSidebar } from "@/components/components/layoutComponents/app-sidebar";
import { Footer } from "@/components/layout/Footer";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AuthenticatedDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar className="z-30" />
      <SidebarInset className="min-h-svh font-sans">
        <div className="sticky top-2 z-10 px-2">
          <SidebarTrigger />
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
