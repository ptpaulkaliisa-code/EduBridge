"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const RESEND_SECONDS = 60;

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneNumber = searchParams.get("phone") ?? "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, otp }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Invalid code");
      return;
    }

    router.push(data.redirectTo ?? "/");
  }

  async function handleResend() {
    setError(null);
    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    if (res.ok) {
      setSecondsLeft(RESEND_SECONDS);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to resend code");
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm">
      <h1 className="mb-1 text-2xl font-semibold text-[#172B36]">Enter your code</h1>
      <p className="mb-6 text-sm text-[#3A5A66]">
        We sent a 6-digit code to {phoneNumber || "your phone"}.
      </p>
      <form onSubmit={handleVerify} className="flex flex-col gap-3">
        <Input
          type="text"
          inputMode="numeric"
          maxLength={6}
          name="otp"
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading || otp.length !== 6}>
          {loading ? "Verifying…" : "Verify"}
        </Button>
      </form>
      <button
        type="button"
        onClick={handleResend}
        disabled={secondsLeft > 0}
        className="mt-4 text-xs text-[#114C5A] underline disabled:text-[#3A5A66] disabled:no-underline"
      >
        {secondsLeft > 0 ? `Resend code (${secondsLeft}s)` : "Resend code"}
      </button>
    </div>
  );
}

// OTP verification screen (PRD 5.1, Week 2).
export default function VerifyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F1F6F4] p-6">
      <Suspense fallback={null}>
        <VerifyForm />
      </Suspense>
    </main>
  );
}
