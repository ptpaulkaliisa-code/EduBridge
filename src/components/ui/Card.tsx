import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/format";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#D9E8E2] bg-[#F1F6F4] p-4 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
