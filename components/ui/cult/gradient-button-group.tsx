// Source: https://www.cult-ui.com/docs/components/gradient-button-group (adapted as primary+ghost pair)
"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ButtonDef {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

interface GradientButtonGroupProps {
  primary: ButtonDef;
  ghost?: ButtonDef;
  className?: string;
}

const PrimaryButton = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  ButtonDef & { className?: string }
>(function PrimaryButton({ label, href, onClick, icon, className }, ref) {
  const inner = (
    <span className="flex items-center gap-2">
      {icon}
      {label}
    </span>
  );

  const cls = cn(
    "inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-medium",
    "bg-gradient-to-r from-primary to-ring text-primary-foreground shadow-md",
    "hover:shadow-primary/30 hover:shadow-lg active:scale-[0.98]",
    "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className
  );

  if (href) {
    return (
      <Link href={href} className={cls} ref={ref as React.Ref<HTMLAnchorElement>}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cls}
      ref={ref as React.Ref<HTMLButtonElement>}
    >
      {inner}
    </button>
  );
});

const GhostButton = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  ButtonDef & { className?: string }
>(function GhostButton({ label, href, onClick, icon, className }, ref) {
  const inner = (
    <span className="flex items-center gap-2">
      {icon}
      {label}
    </span>
  );

  const cls = cn(
    "inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-medium",
    "border border-border text-foreground bg-transparent",
    "hover:bg-muted active:scale-[0.98]",
    "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className
  );

  if (href) {
    return (
      <Link href={href} className={cls} ref={ref as React.Ref<HTMLAnchorElement>}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cls}
      ref={ref as React.Ref<HTMLButtonElement>}
    >
      {inner}
    </button>
  );
});

export function GradientButtonGroup({
  primary,
  ghost,
  className,
}: GradientButtonGroupProps) {
  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      <PrimaryButton {...primary} />
      {ghost && <GhostButton {...ghost} />}
    </div>
  );
}

export default GradientButtonGroup;
