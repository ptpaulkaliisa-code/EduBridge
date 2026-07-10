import { cn } from "@/lib/utils/format";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-[#D9E8E2] border-t-[#114C5A]",
        className,
      )}
    />
  );
}
