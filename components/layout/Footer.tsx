"use client";

import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t px-4 py-3">
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <Link href="/about-us" className="hover:underline">
          About us
        </Link>
        <Link href="/privacy-policy" className="hover:underline">
          Privacy policy
        </Link>
        <Link href="/terms-of-service" className="hover:underline">
          Terms of service
        </Link>
      </div>
    </footer>
  );
}
