"use client";

import { RefObject, useEffect } from "react";
import { useMotionValue, useSpring } from "motion/react";

export function useMouseMotionValues(ref: RefObject<HTMLElement | null>) {
  const rawMx = useMotionValue(0.5);
  const rawMy = useMotionValue(0.5);

  const mx = useSpring(rawMx, { stiffness: 80, damping: 24 });
  const my = useSpring(rawMy, { stiffness: 80, damping: 24 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      rawMx.set((e.clientX - rect.left) / rect.width);
      rawMy.set((e.clientY - rect.top) / rect.height);
    };

    const handleLeave = () => {
      rawMx.set(0.5);
      rawMy.set(0.5);
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [ref, rawMx, rawMy]);

  return { mx, my };
}
