"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// Phone OTP login (PRD 5.1, Week 2).
export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    router.push(`/verify?phone=${encodeURIComponent(data.phoneNumber)}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#114C5A] p-6">
      <Image src="/logo-on-teal.svg" alt="EduBridge Africa" width={220} height={56} priority />
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-[#172B36]">Log in</h1>
        <p className="mb-6 text-sm text-[#3A5A66]">
          Enter your phone number to receive a login code.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            type="tel"
            name="phoneNumber"
            placeholder="0755 213 838"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading || !phoneNumber}>
            {loading ? "Sending…" : "Send OTP"}
          </Button>
        </form>
        <p className="mt-4 text-xs text-[#3A5A66]">
          By continuing you agree to EduBridge&apos;s terms and privacy policy.
        </p>
      </div>
    </main>
  );
}
