"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RiRobot2Line, RiUserLine } from "@remixicon/react";
import { AnimatedNumber } from "@/components/ui/cult/animated-number";

const MESSAGES = [
  { role: "user", text: "How much did I spend on food last month?" },
  { role: "ai", text: null, number: 284, prefix: "$", suffix: " on food in April." },
  { role: "user", text: "Is that over my budget?" },
  { role: "ai", text: "Yes — your budget is $250. You're $34 over. Want me to suggest cuts?" },
];

const REVEAL_DELAYS = [400, 1600, 3000, 4200];

function TypingDots() {
  return (
    <div className="flex items-center gap-0.5 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1 w-1 rounded-full bg-muted-foreground/50"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

interface Props { isActive: boolean }

export function AnimChat({ isActive }: Props) {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [typingIdx, setTypingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    MESSAGES.forEach((msg, i) => {
      if (msg.role === "ai") {
        timers.push(setTimeout(() => setTypingIdx(i), REVEAL_DELAYS[i] - 400));
        timers.push(setTimeout(() => {
          setTypingIdx(null);
          setVisibleMessages((p) => [...p, i]);
        }, REVEAL_DELAYS[i]));
      } else {
        timers.push(setTimeout(() => setVisibleMessages((p) => [...p, i]), REVEAL_DELAYS[i]));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [isActive]);

  return (
    <div className="flex flex-col gap-2 p-2 max-h-52 overflow-hidden">
      <AnimatePresence>
        {MESSAGES.map((msg, i) => {
          const visible = visibleMessages.includes(i);
          const isTyping = typingIdx === i;
          if (!visible && !isTyping) return null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className={`flex items-start gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] ${
                  msg.role === "ai"
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {msg.role === "ai" ? <RiRobot2Line size={11} /> : <RiUserLine size={11} />}
              </div>
              <div
                className={`rounded-xl px-2.5 py-1.5 text-[10px] leading-relaxed max-w-[75%] ${
                  msg.role === "ai"
                    ? "bg-muted/60 text-foreground rounded-tl-sm"
                    : "bg-primary/10 text-foreground rounded-tr-sm"
                }`}
              >
                {isTyping ? (
                  <TypingDots />
                ) : msg.number !== undefined ? (
                  <span>
                    {msg.prefix}
                    <AnimatedNumber value={msg.number} />{msg.suffix}
                  </span>
                ) : (
                  msg.text
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
