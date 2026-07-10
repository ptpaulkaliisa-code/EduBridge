import { cn } from "@/lib/utils/format";

type ToastVariant = "success" | "error" | "info";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-[#114C5A]",
};

export function Toast({ message, variant = "info" }: ToastProps) {
  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm text-white shadow-lg",
        VARIANT_CLASSES[variant],
      )}
    >
      {message}
    </div>
  );
}
