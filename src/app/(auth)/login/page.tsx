import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// Phone OTP login (PRD 5.1, Week 2). Wires up to /api/auth/request-otp
// once Supabase phone auth is configured.
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F1F6F4] p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-[#172B36]">EduBridge Africa</h1>
        <p className="mb-6 text-sm text-[#3A5A66]">
          Enter your phone number to receive a login code.
        </p>
        <form className="flex flex-col gap-3">
          <Input type="tel" name="phoneNumber" placeholder="0755 213 838" required />
          <Button type="submit">Send OTP</Button>
        </form>
        <p className="mt-4 text-xs text-[#3A5A66]">
          By continuing you agree to EduBridge&apos;s terms and privacy policy.
        </p>
      </div>
    </main>
  );
}
