"use client";

import { FeatureCard } from "./feature-card";
import { AnimCategories } from "./anim-categories";
import { AnimReceipt } from "./anim-receipt";
import { AnimReports } from "./anim-reports";
import { AnimChat } from "./anim-chat";
import { AnimForecast } from "./anim-forecast";
import { AnimPortfolio } from "./anim-portfolio";
import { GridBeam } from "@/components/ui/cult/grid-beam";
import {
  RiPriceTag3Line,
  RiScanLine,
  RiFileChartLine,
  RiChat3Line,
  RiLineChartLine,
  RiBriefcaseLine,
} from "@remixicon/react";

const FEATURES = [
  {
    icon: <RiPriceTag3Line size={18} />,
    title: "Auto-categorization",
    description: "Every transaction tagged instantly.",
    animation: (isActive: boolean) => <AnimCategories isActive={isActive} />,
  },
  {
    icon: <RiScanLine size={18} />,
    title: "Receipt scanning",
    description: "Snap a photo — data extracted by VLM.",
    animation: (isActive: boolean) => <AnimReceipt isActive={isActive} />,
  },
  {
    icon: <RiFileChartLine size={18} />,
    title: "Smart reports",
    description: "PDF summaries generated on demand.",
    animation: (isActive: boolean) => <AnimReports isActive={isActive} />,
  },
  {
    icon: <RiChat3Line size={18} />,
    title: "AI chat",
    description: "Ask questions about your money.",
    animation: (isActive: boolean) => <AnimChat isActive={isActive} />,
  },
  {
    icon: <RiLineChartLine size={18} />,
    title: "Spend tracking",
    description: "Know exactly where every dollar goes, every month.",
    animation: (isActive: boolean) => <AnimForecast isActive={isActive} />,
  },
  {
    icon: <RiBriefcaseLine size={18} />,
    title: "Portfolio overview",
    description: "Investments tracked alongside spending.",
    animation: (isActive: boolean) => <AnimPortfolio isActive={isActive} />,
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="relative py-24 scroll-mt-14 overflow-hidden">
      <GridBeam
        className="opacity-25"
        rows={5}
        cols={7}
        active
        duration={16}
        strength={0.5}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Everything you need, nothing you don&apos;t.
          </h2>
          <p className="mt-3 text-muted-foreground text-base max-w-xl mx-auto">
            Six intelligent tools that run silently in the background so you never have to think about money management again.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              description={f.description}
              animation={f.animation}
              delay={i * 0.08}
              gradientIndex={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesGrid;
