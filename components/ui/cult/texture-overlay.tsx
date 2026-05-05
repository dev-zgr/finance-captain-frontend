// Source: https://www.cult-ui.com/docs/components/texture-overlay
import { cn } from "@/lib/utils";

export type TextureType =
  | "dots"
  | "grid"
  | "noise"
  | "crosshatch"
  | "diagonal"
  | "scatteredDots"
  | "paperGrain"
  | "none";

interface TextureOverlayProps {
  texture?: TextureType;
  opacity?: number;
  className?: string;
}

const texturePatterns: Record<TextureType, string> = {
  dots: "bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.4)_1px,transparent_0)] bg-[length:8px_8px]",
  grid: "bg-[linear-gradient(rgba(0,0,0,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.3)_1px,transparent_1px)] bg-[length:12px_12px]",
  noise:
    "bg-[radial-gradient(circle_at_2px_2px,rgba(0,0,0,0.25)_1px,transparent_0)] bg-[length:6px_6px]",
  crosshatch:
    "bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px),repeating-linear-gradient(-45deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)]",
  diagonal:
    "bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,0.2),rgba(0,0,0,0.2)_1px,transparent_1px,transparent_6px)]",
  scatteredDots:
    "bg-[radial-gradient(circle_at_3px_7px,rgba(0,0,0,0.3)_1px,transparent_0),radial-gradient(circle_at_11px_2px,rgba(0,0,0,0.3)_1px,transparent_0),radial-gradient(circle_at_7px_12px,rgba(0,0,0,0.3)_1px,transparent_0)] bg-[length:16px_16px]",
  paperGrain:
    "bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.1)_0px,transparent_1px,transparent_3px),repeating-linear-gradient(90deg,rgba(0,0,0,0.1)_0px,transparent_1px,transparent_4px),repeating-linear-gradient(45deg,rgba(0,0,0,0.05)_0px,transparent_1px,transparent_5px)]",
  none: "",
};

export function TextureOverlay({
  texture = "noise",
  opacity = 0.3,
  className,
}: TextureOverlayProps) {
  if (texture === "none") return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 mix-blend-overlay",
        texturePatterns[texture],
        className
      )}
      style={{ opacity }}
    />
  );
}
