import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// OTP verification screen (PRD 5.1, Week 2). Wires up to
// /api/auth/verify-otp once Supabase phone auth is configured.
export default function VerifyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F1F6F4] p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-[#172B36]">Enter your code</h1>
        <p className="mb-6 text-sm text-[#3A5A66]">
          We sent a 6-digit code to your phone.
        </p>
        <form className="flex flex-col gap-3">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            name="otp"
            placeholder="123456"
            required
          />
          <Button type="submit">Verify</Button>
        </form>
        <button type="button" className="mt-4 text-xs text-[#114C5A] underline" disabled>
          Resend code (60s)
        </button>
      </div>
    </main>
  );
}
