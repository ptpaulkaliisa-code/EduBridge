import Link from "next/link";

// Landing page (PRD Section 9). Redirects into role-based dashboards
// once auth (Week 2) is wired up; for now it links to login.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-[#F1F6F4] px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-[#172B36]">
        EduBridge Africa
      </h1>
      <p className="max-w-md text-lg text-[#3A5A66]">
        Real-time attendance, grades, and fee visibility for parents — no app
        download required, SMS-first, built for Uganda.
      </p>
      <Link
        href="/login"
        className="rounded-full bg-[#114C5A] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0d3a45]"
      >
        Log in
      </Link>
    </main>
  );
}
