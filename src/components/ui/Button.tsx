import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/format";

type Variant = "primary" | "secondary" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-[#114C5A] text-white hover:bg-[#0d3a45]",
  secondary: "bg-[#FFC801] text-[#172B36] hover:bg-[#e6b400]",
  outline: "border border-[#114C5A] text-[#114C5A] hover:bg-[#D9E8E2]",
  ghost: "text-[#114C5A] hover:bg-[#F1F6F4]",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
