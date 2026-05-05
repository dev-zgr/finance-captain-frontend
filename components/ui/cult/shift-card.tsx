// Source: https://www.cult-ui.com/docs/components/shift-card
"use client";

import * as React from "react";
import { motion, MotionProps } from "motion/react";

import { cn } from "@/lib/utils";

interface ShiftCardProps extends Omit<MotionProps, "onAnimationStart" | "onAnimationComplete"> {
  className?: string;
  children?: React.ReactNode;
}

const ShiftCard = React.forwardRef<HTMLDivElement, ShiftCardProps>(
  ({ className, children, ...props }, ref) => {
    const [isHovered, setHovered] = React.useState(false);

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative flex flex-col overflow-hidden rounded-xl bg-card",
          "shadow-[0px_1px_1px_0px_rgba(0,0,0,0.05),0px_1px_1px_0px_rgba(255,252,240,0.5)_inset,0px_0px_0px_1px_hsla(0,0%,100%,0.1)_inset,0px_0px_1px_0px_rgba(28,27,26,0.5)]",
          "dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(0,0,0,0.1),0_2px_2px_0_rgba(0,0,0,0.1),0_4px_4px_0_rgba(0,0,0,0.1),0_8px_8px_0_rgba(0,0,0,0.1)]",
          "hover:cursor-pointer",
          className
        )}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        {...props}
      >
        {typeof children === "function"
          ? (children as (isHovered: boolean) => React.ReactNode)(isHovered)
          : children}
      </motion.div>
    );
  }
);

ShiftCard.displayName = "ShiftCard";

export { ShiftCard };
export default ShiftCard;
