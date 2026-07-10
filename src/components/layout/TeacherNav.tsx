import Link from "next/link";

const LINKS = [
  { href: "/teacher", label: "Dashboard" },
  { href: "/teacher/attendance", label: "Attendance" },
  { href: "/teacher/grades", label: "Grades" },
  { href: "/teacher/fees", label: "Fees" },
  { href: "/teacher/announcements", label: "Announcements" },
  { href: "/teacher/incidents", label: "Incidents" },
  { href: "/teacher/daily-reports", label: "Daily Reports" },
];

export function TeacherNav() {
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
