"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { HeroColorPanels } from "@/components/ui/cult/hero-color-panels";
import { TextureOverlay } from "@/components/ui/cult/texture-overlay";
import { GradientButtonGroup } from "@/components/ui/cult/gradient-button-group";
import { TextGif } from "@/components/ui/cult/text-gif";
import { RiArrowRightLine } from "@remixicon/react";

const easing = [0.2, 0.7, 0.2, 1] as const;

export function MarketingCta() {
  const { isAuthenticated, isHydrated, content } = useSelector((s: RootState) => s.auth);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const shouldReduceMotion = useReducedMotion();

  const showDashboard = isHydrated && isAuthenticated;
  const firstName = content?.user?.firstName ?? "";

  return (
    <HeroColorPanels className="py-32 relative">
      <TextureOverlay texture="noise" opacity={0.2} />

      <div ref={ref} className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 text-center flex flex-col items-center gap-8">
        <motion.h2
          className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.1]"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: easing }}
        >
          {showDashboard ? (
            <>
              Welcome back,{" "}
              <TextGif
                text={firstName || "Captain"}
                as="span"
              />
              .
            </>
          ) : (
            <>
              Take the{" "}
              <TextGif
                text="wheel"
                as="span"
              />{" "}
              of your money.
            </>
          )}
        </motion.h2>

        <motion.p
          className="text-base sm:text-lg text-muted-foreground max-w-lg"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.12, duration: 0.6, ease: easing }}
        >
          Three minutes to set up. A lifetime of clarity.
        </motion.p>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.22, duration: 0.6, ease: easing }}
        >
          {showDashboard ? (
            <GradientButtonGroup
              primary={{ label: "Open Dashboard", href: "/dashboard", icon: <RiArrowRightLine size={15} /> }}
              ghost={{ label: "View Reports", href: "/reports" }}
            />
          ) : (
            <GradientButtonGroup
              primary={{ label: "Get Started Free", href: "/login", icon: <RiArrowRightLine size={15} /> }}
              ghost={{ label: "Learn More", href: "#features" }}
            />
          )}
        </motion.div>
      </div>
    </HeroColorPanels>
  );
}

export default MarketingCta;
