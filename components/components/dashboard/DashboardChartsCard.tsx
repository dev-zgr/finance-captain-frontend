"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import { AccountTimeSeriesChart } from "@/components/components/checking-account/account-time-series-chart";
import { DebtsTimeSeriesChart } from "@/components/components/debts-account/debts-time-series-chart";
import { InvestmentChartsCard } from "@/components/components/investment-account/overview/investment-charts-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = ["checking", "debts", "investments"] as const;
type Tab = (typeof TABS)[number];

const SLIDE_INTERVAL_MS = 5000;

const TAB_CONTENT_ANIMATION =
  "data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-right-4 data-[state=active]:duration-300";

type Props = {
  token: string;
};

export function DashboardChartsCard({ token }: Props) {
  const [tab, setTab] = useState<Tab>("checking");
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) return;

    intervalRef.current = setInterval(() => {
      setTab((current) => TABS[(TABS.indexOf(current) + 1) % TABS.length]);
    }, SLIDE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [paused]);

  const handleTabChange = (next: string) => {
    setTab(next as Tab);
    setPaused(true);
  };

  return (
    <Tabs
      value={tab}
      onValueChange={handleTabChange}
      className="col-span-7 flex h-full flex-col gap-3 max-lg:col-span-12"
    >
      <div className="flex items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="checking">Checking</TabsTrigger>
          <TabsTrigger value="debts">Debts</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
        </TabsList>
        <Button
          variant="ghost"
          type="button"
          aria-label={paused ? "Resume auto-slide" : "Pause auto-slide"}
          onClick={() => setPaused((current) => !current)}
          className="size-7 p-0 [&_svg]:size-3"
        >
          {paused ? <Play /> : <Pause />}
        </Button>
      </div>
      <TabsContent
        value="checking"
        className={`flex-1 ${TAB_CONTENT_ANIMATION}`}
      >
        <AccountTimeSeriesChart token={token} />
      </TabsContent>
      <TabsContent
        value="debts"
        className={`flex-1 ${TAB_CONTENT_ANIMATION}`}
      >
        <DebtsTimeSeriesChart token={token} />
      </TabsContent>
      <TabsContent
        value="investments"
        className={`flex-1 ${TAB_CONTENT_ANIMATION}`}
      >
        <InvestmentChartsCard token={token} />
      </TabsContent>
    </Tabs>
  );
}
