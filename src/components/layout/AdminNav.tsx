import Link from "next/link";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/classes", label: "Classes" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/teachers", label: "Teachers" },
  { href: "/admin/attendance", label: "Attendance" },
  { href: "/admin/grades", label: "Grades" },
  { href: "/admin/fees", label: "Fees" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/incidents", label: "Incidents" },
  { href: "/admin/system", label: "System" },
];

export function AdminNav() {
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
