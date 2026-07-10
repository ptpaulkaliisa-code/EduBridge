"use client";

import { useRouter, usePathname } from "next/navigation";

interface ChildOption {
  id: string;
  fullName: string;
}

// PRD 8.4's [child name ▾] switcher. Hidden when there's only one
// child, since there's nothing to switch between.
export function ChildSelector({
  options,
  currentChildId,
}: {
  options: ChildOption[];
  currentChildId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (options.length <= 1) return null;

  return (
    <select
      value={currentChildId}
      onChange={(e) => router.push(`${pathname}?childId=${e.target.value}`)}
      className="rounded-lg border border-[#D9E8E2] bg-white px-3 py-2 text-sm"
    >
      {options.map((c) => (
        <option key={c.id} value={c.id}>
          {c.fullName}
        </option>
      ))}
    </select>
  );
}
