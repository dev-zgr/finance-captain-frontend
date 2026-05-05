"use client";

import { RefObject } from "react";
import { useInView } from "motion/react";

export function useSectionInView(
  ref: RefObject<Element | null>,
  amount: number = 0.18,
) {
  return useInView(ref, { once: true, amount });
}
