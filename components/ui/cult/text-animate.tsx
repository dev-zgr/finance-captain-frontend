// Source: https://www.cult-ui.com/docs/components/text-animate
"use client";

import { FC, useEffect, useRef } from "react";
import { HTMLMotionProps, motion, useAnimation, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type AnimationType = "fadeIn" | "fadeInUp" | "calmInUp" | "whipInUp";

interface TextAnimateProps extends HTMLMotionProps<"div"> {
  text: string;
  type?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
}

const animationVariants = {
  fadeIn: {
    container: {
      hidden: { opacity: 0 },
      visible: (i = 1) => ({
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: i * 0.3 },
      }),
    },
    child: {
      visible: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 12, stiffness: 100 } },
      hidden: { opacity: 0, y: 10 },
    },
  },
  fadeInUp: {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
    },
    child: {
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      hidden: { opacity: 0, y: 20 },
    },
  },
  calmInUp: {
    container: {
      hidden: {},
      visible: (i = 1) => ({
        transition: { staggerChildren: 0.06, delayChildren: 0.2 * i },
      }),
    },
    child: {
      hidden: { y: "200%", transition: { ease: [0.455, 0.03, 0.515, 0.955] as const, duration: 0.85 } },
      visible: { y: 0, transition: { ease: [0.125, 0.92, 0.69, 0.975] as const, duration: 0.75 } },
    },
  },
  whipInUp: {
    container: {
      hidden: {},
      visible: (i = 1) => ({
        transition: { staggerChildren: 0.05, delayChildren: 0.2 * i },
      }),
    },
    child: {
      hidden: { y: "200%", transition: { ease: [0.455, 0.03, 0.515, 0.955] as const, duration: 0.45 } },
      visible: { y: 0, transition: { ease: [0.5, -0.15, 0.25, 1.05] as const, duration: 0.75 } },
    },
  },
};

const TextAnimate: FC<TextAnimateProps> = ({
  text,
  type = "calmInUp",
  delay = 0,
  className,
  as: _as = "div",
  ...props
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const shouldReduceMotion = useReducedMotion();
  const ctrls = useAnimation();
  const { container, child } = animationVariants[type];

  useEffect(() => {
    if (shouldReduceMotion) {
      ctrls.set("visible");
      return;
    }
    if (isInView) {
      ctrls.start("visible");
    }
  }, [ctrls, isInView, shouldReduceMotion]);

  const words = text.split(" ");

  return (
    <motion.div
      ref={ref}
      style={{ display: "flex", flexWrap: "wrap", gap: "0.3em", overflow: "hidden" }}
      variants={container}
      initial="hidden"
      animate={ctrls}
      custom={delay}
      className={cn(className)}
      {...props}
    >
      {words.map((word, index) => (
        <span key={index} style={{ overflow: "hidden", display: "inline-block" }}>
          <motion.span
            variants={child}
            style={{ display: "inline-block" }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.div>
  );
};

export { TextAnimate };
export default TextAnimate;
