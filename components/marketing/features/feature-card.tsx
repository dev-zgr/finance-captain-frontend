"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ShiftCard } from "@/components/ui/cult/shift-card";
import { cn } from "@/lib/utils";

const ICON_GRADIENTS = [
  "linear-gradient(135deg, #a855f7, #6366f1)",
  "linear-gradient(135deg, #3b82f6, #06b6d4)",
  "linear-gradient(135deg, #10b981, #3b82f6)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #ec4899, #a855f7)",
  "linear-gradient(135deg, #06b6d4, #10b981)",
];

// Slightly longer than the longest animation (anim-chat tops at ~5s)
const AUTO_RESTART_MS = 6500;

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  animation: (isActive: boolean) => React.ReactNode;
  delay?: number;
  gradientIndex?: number;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  animation,
  delay = 0,
  gradientIndex = 0,
  className,
}: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<HTMLDivElement>(null);
  const [cycle, setCycle] = useState(0);

  const isInView = useInView(cardRef, { once: true, amount: 0.25 });
  const isAnimActive = useInView(animRef, { once: false, amount: 0.15 });
  const shouldReduceMotion = useReducedMotion();

  // Auto-restart: increment cycle while card is visible
  useEffect(() => {
    if (!isAnimActive) return;
    const id = setInterval(
      () => setCycle((c) => c + 1),
      AUTO_RESTART_MS
    );
    return () => clearInterval(id);
  }, [isAnimActive]);

  const gradient = ICON_GRADIENTS[gradientIndex % ICON_GRADIENTS.length];

  return (
    <motion.div
      ref={cardRef}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
      className={cn("h-full", className)}
    >
      <ShiftCard className="h-full flex flex-col">
        <div className="flex flex-col flex-1 p-5 gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white shrink-0"
              style={{
                background: gradient,
                backgroundSize: "200% 200%",
                animation: "gradient-shift 4s ease infinite",
                animationDelay: `${gradientIndex * -0.7}s`,
              }}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </div>

          {/* Fixed height stops layout shifts during animation */}
          <div
            ref={animRef}
            className="overflow-hidden rounded-lg border border-border bg-background/50 h-56"
          >
            <div key={isAnimActive ? `on-${cycle}` : "off"} className="h-full">
              {animation(isAnimActive)}
            </div>
          </div>
        </div>
      </ShiftCard>
    </motion.div>
  );
}

export default FeatureCard;
