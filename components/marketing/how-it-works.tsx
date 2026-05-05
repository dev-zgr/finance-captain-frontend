"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { RiLoginBoxLine, RiScanLine, RiRobot2Line } from "@remixicon/react";

const STEPS = [
  {
    step: "01",
    icon: RiLoginBoxLine,
    title: "Sign in",
    description: "Connect your accounts securely in under a minute. No spreadsheets, no manual entry.",
  },
  {
    step: "02",
    icon: RiScanLine,
    title: "Add or scan",
    description: "Import transactions automatically or scan receipts with your camera. Either works.",
  },
  {
    step: "03",
    icon: RiRobot2Line,
    title: "Live on autopilot",
    description: "Finance Captain categorizes, analyzes, and alerts — you just check in when you want.",
  },
];

const easing = [0.2, 0.7, 0.2, 1] as const;

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.2 });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="how-it-works" ref={sectionRef} className="py-24 scroll-mt-14 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Set up once. Forget forever.
          </h2>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-[38px] left-1/2 -translate-x-1/2 w-[calc(66%-2rem)] h-px overflow-visible pointer-events-none" aria-hidden="true">
            <svg viewBox="0 0 400 4" className="w-full overflow-visible" preserveAspectRatio="none">
              <motion.line
                x1="0" y1="2" x2="400" y2="2"
                stroke="var(--border)"
                strokeWidth={1.5}
                strokeDasharray="1100"
                initial={{ strokeDashoffset: shouldReduceMotion ? 0 : 1100 }}
                animate={isInView ? { strokeDashoffset: 0 } : { strokeDashoffset: 1100 }}
                transition={{ duration: 1.6, ease: "easeOut", delay: 0.3 }}
              />
            </svg>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8">
            {STEPS.map(({ step, icon: Icon, title, description }, i) => (
              <div key={step} className="flex flex-col items-center text-center gap-4">
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: -20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                  transition={{
                    delay: isInView ? i * 0.18 : 0,
                    type: "spring",
                    stiffness: 220,
                    damping: 16,
                  }}
                  className="relative flex h-[76px] w-[76px] items-center justify-center rounded-2xl bg-card border border-border shadow-sm text-primary z-10"
                >
                  <Icon size={32} />
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </motion.div>

                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  transition={{
                    delay: isInView ? i * 0.18 + 0.15 : 0,
                    duration: 0.5,
                    ease: easing,
                  }}
                  className="flex flex-col gap-1.5"
                >
                  <h3 className="text-base font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
