import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/format";

type Tone = "success" | "warning" | "danger" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-green-100 text-green-800",
  warning: "bg-[#FFC801]/20 text-[#8a6a00]",
  danger: "bg-red-100 text-red-800",
  neutral: "bg-[#D9E8E2] text-[#172B36]",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
