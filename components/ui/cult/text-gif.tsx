// Source: https://www.cult-ui.com/docs/components/text-gif
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TextGifProps {
  text: string;
  videoSrc?: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

function canUseVideo(videoSrc: string | undefined): boolean {
  if (!videoSrc) return false;
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !conn?.saveData;
}

export function TextGif({
  text,
  videoSrc,
  className,
  as: Tag = "span",
}: TextGifProps) {
  const [useVideo] = useState(() => canUseVideo(videoSrc));

  if (!useVideo || !videoSrc) {
    return (
      <Tag
        className={cn("inline-block bg-clip-text text-transparent", className)}
        style={{
          backgroundImage:
            "linear-gradient(90deg, #a855f7, #6366f1, #3b82f6, #06b6d4, #10b981, #a855f7)",
          backgroundSize: "300% 100%",
          animation: "gradient-shift 3s linear infinite",
        }}
      >
        {text}
      </Tag>
    );
  }

  return (
    <Tag className={cn("relative inline-block", className)}>
      <span className="sr-only">{text}</span>
      <span
        aria-hidden="true"
        className="relative inline-block overflow-hidden"
        style={{
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ mixBlendMode: "multiply" }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        {text}
      </span>
    </Tag>
  );
}

export default TextGif;
