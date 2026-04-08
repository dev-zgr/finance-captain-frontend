"use client";

import React from "react";

import { Card } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <div className="border-b bg-background">
          <Header />
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-8">
            {children}
      </main>

      <div className="border-t bg-background">
        <div className="mx-auto w-full max-w-3xl px-4">
          <Footer />
        </div>
      </div>
    </div>
  );
}
