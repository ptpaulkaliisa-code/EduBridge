import Link from "next/link";

const LINKS = [
  { href: "/parent", label: "Dashboard" },
  { href: "/parent/attendance", label: "Attendance" },
  { href: "/parent/grades", label: "Grades" },
  { href: "/parent/fees", label: "Fees" },
  { href: "/parent/announcements", label: "Announcements" },
  { href: "/parent/incidents", label: "Incidents" },
  { href: "/parent/daily-reports", label: "Daily Reports" },
];

export function ParentNav() {
  return (
    <nav className="flex flex-col gap-1 bg-[#172B36] p-4 text-[#D9E8E2]">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-lg px-3 py-2 text-sm hover:bg-[#114C5A] hover:text-white"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
