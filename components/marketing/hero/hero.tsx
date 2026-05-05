"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { HeroBackground } from "./hero-background";
import { HeroCyclingWord } from "./hero-cycling-word";
import { HeroStage } from "./hero-stage";
import { TextAnimate } from "@/components/ui/cult/text-animate";
import { GradientButtonGroup } from "@/components/ui/cult/gradient-button-group";
import { RiArrowRightLine, RiSparklingLine } from "@remixicon/react";

const easing = [0.2, 0.7, 0.2, 1] as const;

export function Hero() {
  const { isAuthenticated, isHydrated } = useSelector((s: RootState) => s.auth);
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const showDashboard = isHydrated && isAuthenticated;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[90vh] overflow-hidden flex items-center"
    >
      <HeroBackground />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-6">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing }}
          >
            <div
              className="inline-flex rounded-full p-[1px] animate-gradient bg-[length:200%_200%]"
              style={{
                background: "linear-gradient(135deg, #a855f7, #6366f1, #3b82f6, #06b6d4, #a855f7)",
                backgroundSize: "300% 300%",
                animation: "gradient-shift 4s linear infinite",
              }}
            >
              <span className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground">
                <RiSparklingLine size={12} className="text-purple-500" />
                AI-powered personal finance
              </span>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: easing }}
          >
            Your money,{" "}
            <br className="hidden sm:block" />
            <HeroCyclingWord />
          </motion.h1>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: easing }}
          >
            <TextAnimate
              text="Track every transaction, categorize automatically, and get AI-powered insights — all in one place."
              type="calmInUp"
              delay={1}
              as="p"
              className="text-base sm:text-lg text-muted-foreground max-w-lg"
            />
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease: easing }}
          >
            {showDashboard ? (
              <GradientButtonGroup
                primary={{ label: "Open Dashboard", href: "/dashboard", icon: <RiArrowRightLine size={15} /> }}
                ghost={{ label: "View Reports", href: "/reports" }}
              />
            ) : (
              <GradientButtonGroup
                primary={{ label: "Get Started Free", href: "/login", icon: <RiArrowRightLine size={15} /> }}
                ghost={{ label: "See Features", href: "#features" }}
              />
            )}
          </motion.div>

          <motion.p
            className="text-xs text-muted-foreground/70"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.5 }}
          >
            No credit card required · Set up in 3 minutes
          </motion.p>
        </div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: easing }}
          className="hidden lg:block"
        >
          <HeroStage />
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
