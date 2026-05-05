"use client";

import { LazyMotion, domAnimation } from "motion/react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Hero } from "@/components/marketing/hero/hero";
import { CategoryStrip } from "@/components/marketing/category-strip";
import { FeaturesGrid } from "@/components/marketing/features/features-grid";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { AuthSection } from "@/components/marketing/auth-section";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export default function HomePage() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="flex min-h-screen flex-col bg-background">
        <MarketingHeader />
        <main>
          <Hero />
          <CategoryStrip />
          <FeaturesGrid />
          <HowItWorks />
          <AuthSection />
          <MarketingCta />
        </main>
        <MarketingFooter />
      </div>
    </LazyMotion>
  );
}
