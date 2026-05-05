// Source: https://www.cult-ui.com/docs/components/logo-carousel (adapted as horizontal marquee)
"use client";

import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface MarqueeItem {
  id: string;
  children: React.ReactNode;
}

interface LogoCarouselProps {
  items: MarqueeItem[];
  className?: string;
  speed?: number;
}

export function LogoCarousel({ items, className, speed = 40 }: LogoCarouselProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={cn("flex gap-3 overflow-x-auto scrollbar-hide px-4", className)}>
        {items.map((item) => (
          <div key={item.id} className="shrink-0">
            {item.children}
          </div>
        ))}
      </div>
    );
  }

  const duration = `${(items.length * 120) / speed}s`;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <div
        className="flex gap-3 w-max animate-marquee hover:[animation-play-state:paused]"
        style={{ animationDuration: duration, animationTimingFunction: "linear" }}
      >
        {items.map((item) => (
          <div key={`a-${item.id}`} className="shrink-0">
            {item.children}
          </div>
        ))}
        {items.map((item) => (
          <div key={`b-${item.id}`} className="shrink-0" aria-hidden="true">
            {item.children}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LogoCarousel;
