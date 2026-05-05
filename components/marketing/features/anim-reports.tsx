"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RiFilePdfLine, RiDownload2Line, RiCheckLine } from "@remixicon/react";
import { TextAnimate } from "@/components/ui/cult/text-animate";

const STATUS_STEPS: { label: string; delay: number }[] = [
  { label: "Generating…", delay: 0 },
  { label: "Analyzing…", delay: 900 },
  { label: "Ready", delay: 2400 },
];

const BARS = [
  { label: "Jan", value: 65 },
  { label: "Feb", value: 80 },
  { label: "Mar", value: 55 },
  { label: "Apr", value: 90 },
  { label: "May", value: 72 },
];

interface Props { isActive: boolean }

export function AnimReports({ isActive }: Props) {
  const [statusIdx, setStatusIdx] = useState(0);
  const [showBars, setShowBars] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    const timers = [
      setTimeout(() => setStatusIdx(1), 900),
      setTimeout(() => { setStatusIdx(2); setShowBars(true); }, 2400),
      setTimeout(() => setShowComment(true), 3000),
      setTimeout(() => setShowDownload(true), 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isActive]);

  const status = STATUS_STEPS[statusIdx];
  const isReady = statusIdx === 2;

  return (
    <div className="flex flex-col gap-3 p-2">
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <RiFilePdfLine size={16} className="text-muted-foreground" />
          <div>
            <div className="text-xs font-medium text-foreground">May 2026 Report</div>
            <div className="text-[10px] text-muted-foreground">Monthly summary</div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={status.label}
            initial={{ opacity: 0, width: 80 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${
              isReady
                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {isReady && <RiCheckLine size={10} />}
            {status.label}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-end gap-1.5 h-16 px-1">
        {BARS.map((bar, i) => (
          <div key={bar.label} className="flex flex-col items-center gap-1 flex-1">
            <motion.div
              className="w-full rounded-t-sm bg-primary/70"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: showBars ? 1 : 0 }}
              style={{ height: `${bar.value}%`, transformOrigin: "bottom" }}
              transition={{ delay: showBars ? i * 0.08 : 0, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
            />
            <span className="text-[8px] text-muted-foreground">{bar.label}</span>
          </div>
        ))}
      </div>

      {showComment && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border border-border bg-muted/30 px-3 py-2"
        >
          <TextAnimate
            text="Spending up 12% in April — driven by travel. May looks on track."
            type="fadeInUp"
            as="p"
            className="text-[10px] text-muted-foreground"
          />
        </motion.div>
      )}

      {showDownload && (
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 self-start rounded-md border border-border px-3 py-1.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors"
        >
          <RiDownload2Line size={11} />
          Download PDF
        </motion.button>
      )}
    </div>
  );
}
