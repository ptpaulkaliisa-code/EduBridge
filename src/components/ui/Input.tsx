import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/format";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm text-[#172B36] placeholder:text-[#3A5A66]/60 focus:outline-none focus:ring-2 focus:ring-[#114C5A]",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
