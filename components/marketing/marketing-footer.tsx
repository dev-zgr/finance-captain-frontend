"use client";

import React from "react";
import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden border-t bg-background">
      {/* Rainbow top edge */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, #a855f7 20%, #3b82f6 50%, #06b6d4 80%, transparent)",
        }}
        aria-hidden="true"
      />

      {/* Faint gradient wash */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          background: "linear-gradient(135deg, #a855f7 0%, #3b82f6 50%, #06b6d4 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
            >
              F
            </div>
            <span
              className="text-sm font-semibold bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(90deg, #a855f7, #3b82f6, #06b6d4)",
              }}
            >
              Finance Captain
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            {[
              { label: "About us", href: "/about-us" },
              { label: "Privacy policy", href: "/privacy-policy" },
              { label: "Terms of service", href: "/terms-of-service" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>

          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} Finance Captain
          </p>
        </div>
      </div>
    </footer>
  );
}
