"use client";

import { useEffect, useReducer } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  DynamicIslandProvider,
  DynamicIsland,
  DynamicContainer,
  DynamicTitle,
  DynamicDescription,
  SIZE_PRESETS,
  useDynamicIslandSize,
} from "@/components/ui/cult/dynamic-island";
import { AnimatedNumber } from "@/components/ui/cult/animated-number";
import { RiBankLine, RiRobot2Line, RiLineChartLine, RiWallet3Line } from "@remixicon/react";

type IslandState = {
  preset: typeof SIZE_PRESETS[keyof typeof SIZE_PRESETS];
  content: React.ReactNode;
};

function BalanceContent() {
  return (
    <DynamicContainer className="flex h-full w-full items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <RiWallet3Line size={14} className="text-white/70" />
        <DynamicTitle className="text-xs text-white/80">Balance</DynamicTitle>
      </div>
      <DynamicDescription className="text-sm font-semibold text-white">
        $<AnimatedNumber value={12_847} precision={2} />
      </DynamicDescription>
    </DynamicContainer>
  );
}

function CategoryContent() {
  return (
    <DynamicContainer className="flex h-full w-full flex-col items-start justify-center gap-1 px-4 py-2">
      <DynamicTitle className="text-[10px] text-white/60 uppercase tracking-wider">Top spend</DynamicTitle>
      <div className="flex gap-2">
        {["Food", "Transport", "Bills"].map((cat) => (
          <DynamicDescription
            key={cat}
            className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white"
          >
            {cat}
          </DynamicDescription>
        ))}
      </div>
    </DynamicContainer>
  );
}

function InsightContent() {
  return (
    <DynamicContainer className="flex h-full w-full flex-col gap-1.5 px-4 py-3">
      <div className="flex items-center gap-1.5">
        <RiRobot2Line size={13} className="text-white/70" />
        <DynamicTitle className="text-[10px] text-white/70 uppercase tracking-wider">AI Insight</DynamicTitle>
      </div>
      <DynamicDescription className="text-xs leading-relaxed text-white/90">
        You saved 18% more than last month on dining out.
      </DynamicDescription>
    </DynamicContainer>
  );
}

function ForecastContent() {
  return (
    <DynamicContainer className="flex h-full w-full items-center justify-between px-4">
      <div className="flex items-center gap-1.5">
        <RiLineChartLine size={14} className="text-white/70" />
        <DynamicTitle className="text-xs text-white/80">Forecast</DynamicTitle>
      </div>
      <DynamicDescription className="text-sm font-semibold text-white">
        +$<AnimatedNumber value={340} precision={0} /> this month
      </DynamicDescription>
    </DynamicContainer>
  );
}

function AccountContent() {
  return (
    <DynamicContainer className="flex h-full w-full flex-col gap-1.5 px-4 py-3">
      <div className="flex items-center gap-1.5">
        <RiBankLine size={13} className="text-white/70" />
        <DynamicTitle className="text-[10px] text-white/70 uppercase tracking-wider">Accounts</DynamicTitle>
      </div>
      <div className="flex items-center justify-between">
        <DynamicDescription className="text-xs text-white/80">Checking</DynamicDescription>
        <DynamicDescription className="text-xs font-medium text-white">
          $<AnimatedNumber value={4_210} precision={2} />
        </DynamicDescription>
      </div>
      <div className="flex items-center justify-between">
        <DynamicDescription className="text-xs text-white/80">Investments</DynamicDescription>
        <DynamicDescription className="text-xs font-medium text-white">
          $<AnimatedNumber value={8_637} precision={2} />
        </DynamicDescription>
      </div>
    </DynamicContainer>
  );
}

const ISLAND_STATES: IslandState[] = [
  { preset: SIZE_PRESETS.COMPACT, content: <BalanceContent /> },
  { preset: SIZE_PRESETS.COMPACT_MEDIUM, content: <CategoryContent /> },
  { preset: SIZE_PRESETS.MEDIUM, content: <InsightContent /> },
  { preset: SIZE_PRESETS.COMPACT, content: <ForecastContent /> },
  { preset: SIZE_PRESETS.TALL, content: <AccountContent /> },
  { preset: SIZE_PRESETS.COMPACT, content: <BalanceContent /> },
];

function IslandCycler({ isInView }: { isInView: boolean }) {
  const { setSize } = useDynamicIslandSize();
  const [stateIdx, setStateIdx] = useReducer(
    (i: number) => (i + 1) % ISLAND_STATES.length,
    0
  );
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView || shouldReduceMotion) return;
    const id = setInterval(() => setStateIdx(), 2400);
    return () => clearInterval(id);
  }, [isInView, shouldReduceMotion]);

  useEffect(() => {
    setSize(ISLAND_STATES[stateIdx].preset as Parameters<typeof setSize>[0]);
  }, [stateIdx, setSize]);

  return (
    <DynamicIsland id="hero-island">
      <motion.div
        key={stateIdx}
        className="h-full w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {ISLAND_STATES[stateIdx].content}
      </motion.div>
    </DynamicIsland>
  );
}

export function HeroIslandStateMachine({ isInView }: { isInView: boolean }) {
  return (
    <DynamicIslandProvider initialSize="compact">
      <IslandCycler isInView={isInView} />
    </DynamicIslandProvider>
  );
}

export default HeroIslandStateMachine;
