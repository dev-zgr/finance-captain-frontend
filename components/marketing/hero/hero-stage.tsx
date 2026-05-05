"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useTransform, useReducedMotion } from "motion/react";
import { useInView } from "motion/react";
import { useMouseMotionValues } from "@/lib/marketing/use-mouse-position";
import { AnimatedNumber } from "@/components/ui/cult/animated-number";
import {
  RiArrowUpLine, RiArrowDownLine, RiLineChartLine,
  RiRobot2Line, RiWallet3Line, RiExchangeLine,
  RiPieChart2Line, RiCalendarLine, RiShieldCheckLine,
} from "@remixicon/react";

/* ─── small reusable visuals ─── */

function Sparkline({ positive = true }: { positive?: boolean }) {
  const d = positive
    ? "M0 28 L10 22 L20 25 L30 16 L40 19 L50 10 L60 13 L70 6 L80 4"
    : "M0 6  L10 10 L20  8 L30 16 L40 13 L50 20 L60 18 L70 24 L80 28";
  return (
    <svg viewBox="0 0 80 36" className="w-20 h-6" aria-hidden="true">
      <path d={d} fill="none" stroke={positive ? "#22c55e" : "#ef4444"}
        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarChart({ values }: { values: number[] }) {
  return (
    <div className="flex items-end gap-[3px] h-10">
      {values.map((h, i) => (
        <div key={i} className="flex-1 rounded-t-[2px]"
          style={{ height: `${h}%`, background: `oklch(0.60 0.22 ${255 + i * 18} / 0.85)` }} />
      ))}
    </div>
  );
}

function BudgetBar({ label, spent, total, colorVar }: { label: string; spent: number; total: number; colorVar: string }) {
  const pct = Math.round((spent / total) * 100);
  const over = pct > 90;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className={over ? "text-red-500 font-medium" : "text-foreground"}>
          ${spent} <span className="text-muted-foreground">/ ${total}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: over ? "#ef4444" : colorVar }}
        />
      </div>
    </div>
  );
}

/* ─── card definitions ─── */

const STOCKS = [
  { symbol: "AAPL", price: 192.53, change: 2.34, action: "BUY",  pos: true },
  { symbol: "NVDA", price: 875.22, change: 5.87, action: "HOLD", pos: true },
  { symbol: "TSLA", price: 243.11, change: 1.22, action: "SELL", pos: false },
];

const TRANSACTIONS = [
  { merchant: "Trader Joe's",   cat: "Food",          amount: -43.28, color: "#f59e0b" },
  { merchant: "Shell Gas",      cat: "Transport",     amount: -48.12, color: "#3b82f6" },
  { merchant: "Salary",         cat: "Income",        amount: 3800,   color: "#22c55e" },
  { merchant: "Netflix",        cat: "Entertainment", amount: -15.99, color: "#a855f7" },
  { merchant: "Amazon",         cat: "Shopping",      amount: -76.40, color: "#ec4899" },
];

const BUDGETS = [
  { label: "Food",          spent: 284, total: 300, color: "#f59e0b" },
  { label: "Transport",     spent:  89, total: 150, color: "#3b82f6" },
  { label: "Entertainment", spent:  45, total: 100, color: "#a855f7" },
  { label: "Shopping",      spent: 156, total: 200, color: "#ec4899" },
];

const CATEGORY_SPEND = [
  { label: "Rent",          pct: 38, color: "#6366f1" },
  { label: "Food",          pct: 22, color: "#f59e0b" },
  { label: "Transport",     pct: 14, color: "#3b82f6" },
  { label: "Shopping",      pct: 12, color: "#ec4899" },
  { label: "Other",         pct: 14, color: "#94a3b8" },
];

const GOALS = [
  { label: "Emergency fund", current: 7400, target: 10000, color: "#22c55e" },
  { label: "Europe trip",    current: 1850, target: 4000,  color: "#a855f7" },
  { label: "New laptop",     current: 680,  target: 1200,  color: "#3b82f6" },
];

function CardPortfolio() {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Total balance</p>
          <div className="text-3xl font-bold tracking-tight">
            $<AnimatedNumber value={12847} precision={2} />
          </div>
          <div className="flex items-center gap-1 mt-1 text-green-500 text-sm font-medium">
            <RiArrowUpLine size={14} />+4.2% this month
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <RiWallet3Line size={20} className="text-primary" />
        </div>
      </div>
      <Sparkline positive />
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Today",     value: "+$341",  green: true },
          { label: "This week", value: "+$892",  green: true },
          { label: "All time",  value: "+28.4%", green: true },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-muted/40 p-2 text-center">
            <div className="text-[10px] text-muted-foreground">{label}</div>
            <div className="text-xs font-semibold mt-0.5 text-green-500">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardPositions() {
  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <RiLineChartLine size={15} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Active positions</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {STOCKS.map((s) => (
          <div key={s.symbol} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-card border border-border text-[10px] font-bold">
                {s.symbol[0]}
              </div>
              <div>
                <div className="text-sm font-semibold">{s.symbol}</div>
                <div className="text-[10px] text-muted-foreground">${s.price.toFixed(2)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs flex items-center gap-0.5 font-medium ${s.pos ? "text-green-500" : "text-red-500"}`}>
                {s.pos ? <RiArrowUpLine size={11} /> : <RiArrowDownLine size={11} />}{s.change}%
              </span>
              <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                s.action === "BUY"  ? "bg-green-500/15 text-green-600"
                : s.action === "SELL" ? "bg-red-500/15 text-red-500"
                : "bg-muted text-muted-foreground"
              }`}>{s.action}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
        <span>Total invested</span>
        <span className="font-semibold text-foreground">$8,634.22</span>
      </div>
    </div>
  );
}

function CardAI() {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
          <RiRobot2Line size={14} className="text-white" />
        </div>
        <span className="text-sm font-medium">AI Financial Brief</span>
      </div>
      <BarChart values={[55, 70, 48, 85, 62, 90, 74]} />
      <div className="rounded-lg bg-muted/40 p-3">
        <p className="text-sm leading-relaxed">
          Saving rate <span className="font-bold text-primary">34%</span> — up 8 pts from last month.
          Food spend dropped <span className="font-bold text-green-500">18%</span>. On track for your Q3 goal.
        </p>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Forecast next month</span>
        <span className="font-semibold text-green-500 flex items-center gap-0.5">
          <RiArrowUpLine size={11} />+$420 saved
        </span>
      </div>
    </div>
  );
}

function CardTransactions() {
  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <RiExchangeLine size={15} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Recent transactions</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {TRANSACTIONS.map((tx) => (
          <div key={tx.merchant} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: tx.color }}>
                {tx.merchant[0]}
              </div>
              <div>
                <div className="text-xs font-medium">{tx.merchant}</div>
                <span className="text-[9px] rounded-full px-1.5 py-0.5"
                  style={{ background: `${tx.color}20`, color: tx.color }}>
                  {tx.cat}
                </span>
              </div>
            </div>
            <span className={`text-xs font-semibold ${tx.amount > 0 ? "text-green-500" : "text-foreground"}`}>
              {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardBudget() {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RiCalendarLine size={15} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">May budget</span>
        </div>
        <span className="text-[10px] text-muted-foreground">12 days left</span>
      </div>
      <div className="flex flex-col gap-3">
        {BUDGETS.map((b) => (
          <BudgetBar key={b.label} label={b.label} spent={b.spent} total={b.total} colorVar={b.color} />
        ))}
      </div>
      <div className="flex items-center justify-between rounded-lg bg-green-500/8 border border-green-500/20 px-3 py-2">
        <span className="text-xs text-green-700 dark:text-green-400 font-medium">Under budget overall</span>
        <span className="text-xs font-bold text-green-600">−$126 saved</span>
      </div>
    </div>
  );
}

function CardSpending() {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <RiPieChart2Line size={15} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Spending by category</span>
      </div>
      {/* Horizontal stacked bar */}
      <div className="h-4 w-full flex rounded-full overflow-hidden gap-0.5">
        {CATEGORY_SPEND.map((c) => (
          <div key={c.label} style={{ width: `${c.pct}%`, background: c.color }} />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {CATEGORY_SPEND.map((c) => (
          <div key={c.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="text-muted-foreground">{c.label}</span>
            </div>
            <span className="font-medium text-foreground">{c.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardGoals() {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <RiShieldCheckLine size={15} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Savings goals</span>
      </div>
      <div className="flex flex-col gap-4">
        {GOALS.map((g) => {
          const pct = Math.round((g.current / g.target) * 100);
          return (
            <div key={g.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{g.label}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: g.color }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>${g.current.toLocaleString()}</span>
                <span>Goal: ${g.target.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CARDS = [
  { id: "portfolio",    label: "Portfolio",    Content: CardPortfolio    },
  { id: "positions",    label: "Positions",    Content: CardPositions    },
  { id: "transactions", label: "Transactions", Content: CardTransactions },
  { id: "budget",       label: "Budget",       Content: CardBudget       },
  { id: "spending",     label: "Spending",     Content: CardSpending     },
  { id: "goals",        label: "Goals",        Content: CardGoals        },
  { id: "ai",           label: "AI Brief",     Content: CardAI           },
];

/* ─── stage ─── */

export function HeroStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });
  const { mx, my } = useMouseMotionValues(containerRef as React.RefObject<HTMLElement>);
  const shouldReduceMotion = useReducedMotion();
  const [cardIdx, setCardIdx] = useState(0);
  const isInViewRef = useRef(false);
  useEffect(() => { isInViewRef.current = isInView; }, [isInView]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const id = setInterval(() => {
      if (isInViewRef.current) setCardIdx((i) => (i + 1) % CARDS.length);
    }, 3400);
    return () => clearInterval(id);
  }, [shouldReduceMotion]);

  const rotateY = useTransform(mx, [0, 1], shouldReduceMotion ? [0, 0] : [-5, 5]);
  const rotateX = useTransform(my, [0, 1], shouldReduceMotion ? [0, 0] : [3, -3]);

  const { Content } = CARDS[cardIdx];

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center w-full"
      style={{ perspective: "1200px" }}
    >
      <motion.div
        className="w-full"
        style={{ rotateY, rotateX, transformStyle: "preserve-3d" }}
        transition={{ type: "spring", stiffness: 80, damping: 24 }}
      >
        {/* Label tabs */}
        <div className="flex gap-1 flex-wrap justify-center mb-3">
          {CARDS.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setCardIdx(i)}
              className={`rounded-full px-3 py-1 text-[10px] font-medium transition-all duration-200 ${
                i === cardIdx
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={CARDS[cardIdx].id}
              initial={shouldReduceMotion ? false : { opacity: 0, x: 48, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={shouldReduceMotion ? {} : { opacity: 0, x: -48, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm shadow-2xl min-h-[280px]"
            >
              <Content />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default HeroStage;
